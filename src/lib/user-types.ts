import type { Timestamp } from 'firebase/firestore';

export type User = {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    organizationId?: string;
    role: 'Learner' | 'Sales' | 'Finance' | 'Business' | 'Operations' | 'Admin' | 'Facilitator' | 'BusinessAdmin' | 'BusinessLearner';
    status: 'Active' | 'Inactive';
    createdAt?: Timestamp;
};
