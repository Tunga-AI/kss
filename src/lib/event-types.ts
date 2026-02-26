import type { Timestamp } from 'firebase/firestore';

export type TicketType = {
    id: string;
    name: string;
    description: string;
    price: number;
    capacity: number;
    soldCount: number;
};

export type Event = {
    id: string;
    title: string;
    slug: string;
    shortDescription: string;
    description: string;
    imageUrl: string;
    date: Timestamp;
    endDate?: Timestamp;
    time: string; // e.g., "09:00 AM - 05:00 PM"
    location: string;
    address?: string;
    eventType: 'Physical' | 'Virtual' | 'Hybrid';
    status: 'draft' | 'published' | 'completed' | 'cancelled';

    // Financials & Ticketing
    currency: string;
    ticketTypes: TicketType[];

    // Presenters
    facilitators: string[]; // facilitator user IDs

    // Metadata
    createdAt: Timestamp;
    updatedAt: Timestamp;
};
