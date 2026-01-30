import type { Timestamp } from 'firebase/firestore';

export type User = {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    role: 'Learner' | 'Sales' | 'Finance' | 'Business' | 'Operations' | 'Admin' | 'Staff';
    status: 'Active' | 'Inactive';
    createdAt?: Timestamp;
};
