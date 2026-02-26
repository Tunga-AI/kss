import { Timestamp } from 'firebase/firestore';

export type MediaImage = {
    id: string; // e.g. "temp_1761901461400_0"
    url: string;
    thumbnailUrl: string;
    caption?: string; // ""
    order: number; // 0
};

export type MediaAlbum = {
    id: string;
    title: string;
    description?: string;
    featuredImage: string; // URL
    eventDate?: Timestamp;
    location?: string;
    authorId: string;
    authorName: string;
    status: 'draft' | 'published' | 'archived'; // Match case if needed, but 'published' is in user sample. existing code uses 'Published' Title Case. I will stick to lowercase 'published' based on user sample.
    type: 'album' | 'video';
    tags?: string[];
    likes: number;
    views: number;
    images: MediaImage[];
    createdAt: Timestamp;
    updatedAt: Timestamp;
    publishedAt?: Timestamp;
};
