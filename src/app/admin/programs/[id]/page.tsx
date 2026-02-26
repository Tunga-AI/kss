'use client';
import { notFound, useParams } from 'next/navigation';
import { ProgramForm } from '../program-form';
import { useFirestore, useDoc } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { Program } from '@/lib/program-types';
import { useMemo } from 'react';

export default function EditProgramPage() {
    const params = useParams();
    const id = Array.isArray(params.id) ? params.id[0] : params.id;
    const firestore = useFirestore();

    const programRef = useMemo(() => {
        if (!firestore || !id) return null;
        return doc(firestore, 'programs', id);
    }, [firestore, id]);

    const { data: program, loading } = useDoc<Program>(programRef as any);

    if (loading) {
        return (
            <div className="p-8 flex items-center justify-center min-h-screen">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-accent" />
            </div>
        );
    }

    if (!program) {
        notFound();
    }

    return <ProgramForm program={program} />;
}
