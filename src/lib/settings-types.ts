import type { Timestamp } from 'firebase/firestore';

export type BrandingSettings = {
    id: string;
    logoUrl?: string;
    faviconUrl?: string;
    homeHeroUrl?: string;
    programsHeroUrl?: string;
    contactHeroUrl?: string;
    aboutHeroUrl?: string;
    frameworkHeroUrl?: string;
    elearningHeroUrl?: string;
    eventsHeroUrl?: string;
    businessHeroUrl?: string;
    galleryHeroUrl?: string;
    loginHeroUrl?: string;
    updatedAt?: Timestamp;
};

export type EmailSettings = {
    id: string;
    smtpHost: string;
    smtpPort: number;
    smtpUser: string;
    smtpPass: string;
    fromName: string;
    fromEmail: string;
    updatedAt?: Timestamp;
};
