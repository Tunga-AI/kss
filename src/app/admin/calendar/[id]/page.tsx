'use client';
import { useParams } from 'next/navigation';
import { useFirestore, useDoc } from '@/firebase';
import { doc } from 'firebase/firestore';
import { SessionForm } from "@/app/admin/classroom/session-form";
import type { ClassroomSession } from '@/lib/classroom-types';

export default function EditSessionPage() {
    const params = useParams();
    const id = Array.isArray(params.id) ? params.id[0] : params.id;
    const firestore = useFirestore();
    const docRef = firestore && id ? doc(firestore, 'classroom', id) : null;
    const { data: session, loading } = useDoc<ClassroomSession>(docRef as any);

    if (loading) return <div className="p-12 text-center animate-pulse">Loading Session Details...</div>;

    return <SessionForm session={session} />;
}
