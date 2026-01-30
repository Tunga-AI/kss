import type { Timestamp } from 'firebase/firestore';

export type Program = {
    id: string;
    title: string;
    description: string;
    imageId: string;
    programType: 'Core Course' | 'E-Learning' | 'Event' | 'Short Course';
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
