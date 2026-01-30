'use client';

import React from 'react';
import { useSearchParams } from 'next/navigation';
import { UserForm } from '../user-form';
import type { User } from '@/lib/user-types';

function CreateUser() {
    const searchParams = useSearchParams();
    const role = searchParams.get('role');

    // Prepare a partial user object with defaults, including the role from URL
    const defaultUser: Partial<User> = {
        role: (role as User['role']) || 'Learner',
    };
    
    return <UserForm user={defaultUser} />;
};

export default function CreateUserPage() {
    return (
        <React.Suspense fallback={<div>Loading...</div>}>
            <CreateUser />
        </React.Suspense>
    )
};
