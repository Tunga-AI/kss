import type { Timestamp } from 'firebase/firestore';

export type Staff = {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    jobTitle: string;
    role: string;
    status: 'Active' | 'Inactive';
    department?: string;
    createdAt?: Timestamp;
    updatedAt?: Timestamp;
};
