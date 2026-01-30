import type { Timestamp } from 'firebase/firestore';

export type Organization = {
    id: string;
    name: string;
    adminId: string;
    tier: 'Startup' | 'Growth' | 'Enterprise' | 'Custom';
    status: 'Active' | 'Trial' | 'Expired' | 'Cancelled';
    subscriptionEndDate?: Timestamp;
    maxLearners: number;
    createdAt?: Timestamp;
};
