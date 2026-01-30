import type { Timestamp } from 'firebase/firestore';

export type BrandingSettings = {
    id: string;
    logoUrl?: string;
    updatedAt?: Timestamp;
};
