import type { Timestamp } from 'firebase/firestore';

export type Learner = {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    program?: string;
    status: 'Active' | 'Inactive' | 'Alumni';
    joinedDate?: string;
};
