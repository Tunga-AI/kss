import type { Timestamp } from 'firebase/firestore';

export type Certificate = {
    id: string;
    learnerName: string;
    learnerEmail: string;
    programTitle: string;
    issuedDate: Timestamp;
    // In a real app, this would link to a generated PDF
    certificateUrl?: string;
};
