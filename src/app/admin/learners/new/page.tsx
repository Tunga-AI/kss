'use client';

import { UserForm } from '../../users/user-form';
import type { User } from '@/lib/user-types';

export default function CreateLearnerPage() {
    // This pre-defines the user as a Learner for the form
    const defaultLearner: Partial<User> = {
        role: 'Learner',
    };
    
    return <UserForm user={defaultLearner} />;
};
