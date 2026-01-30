import type { Timestamp } from 'firebase/firestore';

export type Program = {
    id: string;
    title: string;
    description: string;
    imageUrl: string;
    programType: 'Core' | 'E-Learning' | 'Event' | 'Short';
    createdAt?: Timestamp;
    updatedAt?: Timestamp;

    // Course specific fields
    duration?: string;
    level?: 'Beginner' | 'Intermediate' | 'Advanced';
    takeaways?: string[];
    
    // Event specific fields
    date?: string;
    time?: string;
    location?: string;
    speakers?: { name: string; title: string; avatar: string }[];

    // Common field with different meaning
    price?: string;
};
