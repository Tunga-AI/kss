import type { Timestamp } from 'firebase/firestore';

export type GalleryImage = {
    id: string;
    album: string;
    imageUrl: string;
    description?: string;
    createdAt?: Timestamp;
};
