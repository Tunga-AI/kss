import type { Timestamp } from 'firebase/firestore';

export type ClassroomSession = {
    id: string;
    title: string;
    description: string;
    programId: string;
    facilitatorId?: string;
    startDateTime: Timestamp;
    endDateTime: Timestamp;
    status: 'Scheduled' | 'In Progress' | 'Completed' | 'Cancelled';
};
