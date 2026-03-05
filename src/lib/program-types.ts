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

/** A single downloadable material inside an e-learning module */
export type ElearningMaterial = {
    name: string;
    fileUrl: string;
    fileType: 'pdf' | 'workbook' | 'slide' | 'other';
    sizeBytes?: number;
};

/** A self-contained module for an e-learning program — video + materials */
export type ElearningModule = {
    id: string;           // UUID generated client-side
    title: string;
    description?: string;
    duration?: string;    // e.g. "12 min"
    isPreview: boolean;   // If true, visible without payment
    videoUrl?: string;    // Firebase Storage URL of the lesson video
    thumbnailUrl?: string;
    materials: ElearningMaterial[];
};

/** Instructor profile with optional photo, for e-learning programs */
export type InstructorProfile = {
    name: string;
    title?: string;   // e.g. "Senior Sales Trainer"
    bio?: string;
    imageUrl?: string;
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
    level: number | string; // 3 or "Advanced"

    // Content & Target
    whoIsItFor: string[];
    objectives: string[];
    completionRequirements: string[];

    // Core / structured programs
    curriculumBreakdown: CurriculumModule[];

    // E-Learning specific
    elearningModules?: ElearningModule[];
    instructorProfiles?: InstructorProfile[];
    overviewVideoUrl?: string;   // Short promo/intro video for the e-learning landing page

    // Legacy plain-text instructors (used before profiles were added)
    instructors?: string[];

    // Schedule
    intakes: Intake[];

    // Metadata
    createdAt: Timestamp;
    updatedAt: Timestamp;

    // Classification & admissions
    programType?: 'Core' | 'E-Learning' | 'Short' | 'Event' | 'Corporate';
    organizationId?: string; // For Corporate custom programs
    admissionCost?: number; // Non-refundable application fee

    // Mapped accessors (computed or aliased)
    title?: string;       // Mapped from programName in UI or if data varies
    imageUrl?: string;    // Mapped from image
    description?: string; // Mapped from shortDescription
    duration?: string;    // Mapped from programDuration
    registrationFee?: number | string; // Legacy alias for admissionCost — do not use in new code
};
