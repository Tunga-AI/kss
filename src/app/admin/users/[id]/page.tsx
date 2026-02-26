'use client';
import { notFound, useParams } from 'next/navigation';
import { UserForm } from '../user-form';
import { useUsersFirestore, useDoc } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { User } from '@/lib/user-types';
import { useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export default function EditUserPage() {
    const params = useParams();
    const id = Array.isArray(params.id) ? params.id[0] : params.id;
    const firestore = useUsersFirestore();

    const userRef = useMemo(() => {
        if (!firestore || !id) return null;
        return doc(firestore, 'users', id);
    }, [firestore, id]);

    const { data: user, loading } = useDoc<User>(userRef as any);

    if (loading) {
        return (
            <div className="grid gap-6">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-96 w-full" />
            </div>
        );
    }

    if (!user) {
        notFound();
    }

    return <UserForm user={user} />;
}
