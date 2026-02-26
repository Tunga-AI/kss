'use client';
import { StaffForm } from '../staff-form';
import { useFirestore, useDoc } from '@/firebase';
import { doc } from 'firebase/firestore';
import { RefreshCw } from "lucide-react";
import { useParams } from 'next/navigation';
import type { Staff } from '@/lib/staff-types';

export default function EditStaffPage() {
    const params = useParams();
    const id = params?.id as string;
    const firestore = useFirestore();

    const { data: staff, loading } = useDoc<Staff>(
        (firestore && id ? doc(firestore, 'staff', id) : null) as any
    );

    if (loading) {
        return (
            <div className="p-8 flex items-center justify-center min-h-screen">
                <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!staff && !loading) {
        return <div>Staff member not found</div>;
    }

    return <StaffForm staff={staff || undefined} />;
};
