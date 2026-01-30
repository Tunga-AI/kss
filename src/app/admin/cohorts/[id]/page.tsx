'use client';
import { notFound, useParams } from 'next/navigation';
import { useFirestore, useDoc } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { Cohort } from '@/lib/cohort-types';
import { useMemo } from 'react';
import { CohortForm } from '../cohort-form';
import { Skeleton } from '@/components/ui/skeleton';

export default function EditCohortPage() {
    const params = useParams();
    const id = Array.isArray(params.id) ? params.id[0] : params.id;
    const firestore = useFirestore();

    const cohortRef = useMemo(() => {
        if (!firestore || !id) return null;
        return doc(firestore, 'cohorts', id);
    }, [firestore, id]);

    const { data: cohort, loading } = useDoc<Cohort>(cohortRef);

    if (loading) {
        return (
            <div className="grid gap-6">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-96 w-full" />
            </div>
        );
    }

    if (!cohort) {
        notFound();
    }

    return <CohortForm cohort={cohort} />;
}
