'use client';

import { UserForm } from '../../users/user-form';
import type { User } from '@/lib/user-types';

export default function CreateFacilitatorPage() {
    const defaultFacilitator: Partial<User> = {
        role: 'Facilitator',
    };
    
    return <UserForm user={defaultFacilitator} />;
};
