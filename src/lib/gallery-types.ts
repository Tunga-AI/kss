
import { Timestamp } from 'firebase/firestore';

export interface LegacyGalleryImage {
    id: string;
    album: string;
    description: string;
    imageUrl: string;
    createdAt: Timestamp;
}

export interface Album {
    id: string;
    title: string;
    description: string;
    thumbnailUrl: string;
    createdAt: Timestamp;
    status: 'Published' | 'Draft';
    topics?: string[];
}

export interface AlbumAsset {
    id: string;
    albumId: string;
    type: 'image' | 'video';
    url: string;
    thumbnailUrl?: string; // For videos mainly
    description?: string;
    createdAt: Timestamp;
}
