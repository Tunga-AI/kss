import type { Timestamp } from 'firebase/firestore';

export type Intake = {
    id: string;
    name: string;
    startDate?: Timestamp;
    endDate?: Timestamp;
    status: 'active' | 'closed' | 'upcoming';
    [key: string]: any;
};

export type CurriculumModule = {
    name: string;
    themes: string;
    keyModules: string;
};

export type Program = {
    id: string;
    programNumber?: string; // e.g. "P1", "P2" — human-readable sequential number

    // Core Identity
    programName: string; // "Sales Mastery Program - Level 3"
    slug: string; // "salesmastery"
    shortDescription: string;
    image: string; // URL
    programCode: string;
    status: 'active' | 'draft' | 'archived'; // Lowercase in JSON sample

    // Commercial & Logistics
    price: number;
    currency: string;
    programDuration: string; // "12 Weeks"
    programFormat: string[]; // ["12 Weeks 4 In-person..."]
    level: number; // 3

    // Content & Target
    whoIsItFor: string[];
    objectives: string[];
    completionRequirements: string[];
    curriculumBreakdown: CurriculumModule[];

    // Schedule
    intakes: Intake[];

    // Metadata
    createdAt: Timestamp;
    updatedAt: Timestamp;

    // Classification & admissions
    programType?: 'Core' | 'E-Learning' | 'Short' | 'Event' | 'Corporate';
    organizationId?: string; // For Corporate custom programs
    admissionCost?: number; // Non-refundable application fee

    // Mapped accessors (computed or aliased) can be handled in code, but types should exist if code expects them
    // For now we rely on updating the code to use new field names.
    // Legacy fields kept optional for potential backward compatibility during migration if needed, 
    // but goal is to switch to new schema.
    title?: string; // Mapped from programName in UI or if data varies
    imageUrl?: string; // Mapped from image
    description?: string; // Mapped from shortDescription
    duration?: string; // Mapped from programDuration
    registrationFee?: number | string; // Legacy alias for admissionCost — do not use in new code
};
