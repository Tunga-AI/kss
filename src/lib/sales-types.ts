import type { Timestamp } from 'firebase/firestore';

export type SaleLead = {
    id: string;
    name: string;
    email: string;
    program?: string;
    status: 'Prospect' | 'Lead' | 'Admitted' | 'Lost';
    createdAt?: Timestamp;
};
