import type { Timestamp } from 'firebase/firestore';

export type OrgTier = 'Startup' | 'SME' | 'Corporate' | 'Customer';

export type Organization = {
    id: string;
    name: string;
    adminId: string;
    tier: OrgTier;
    status: 'Active' | 'Trial' | 'Expired' | 'Cancelled' | 'Pending';
    subscriptionEndDate?: Timestamp;
    maxLearners: number;
    createdAt?: Timestamp;

    // Additional organization details
    industry?: string;
    phone?: string;
    website?: string;
    address?: string;
    city?: string;
    country?: string;
    description?: string;
    logoUrl?: string;
    isSetupComplete?: boolean;

    // B2B Subscription info
    subscriptionPeriod?: number; // months
    pricePerUser?: number;
    totalSubscriptionAmount?: number;
    paymentReference?: string;
};
