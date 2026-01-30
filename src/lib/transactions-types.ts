import type { Timestamp } from 'firebase/firestore';

export type Transaction = {
    id: string;
    learnerName: string;
    learnerEmail: string;
    program: string;
    amount: number;
    currency: string;
    status: 'Pending' | 'Success' | 'Failed';
    paystackReference?: string;
    date?: Timestamp;
};
