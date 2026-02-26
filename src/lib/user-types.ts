import type { Timestamp } from 'firebase/firestore';

export type User = {
    id: string;
    name: string;
    email: string;
    phone?: string;
    avatar?: string;
    organizationId?: string;
    role: 'Learner' | 'Sales' | 'Finance' | 'Business' | 'Operations' | 'Admin' | 'Facilitator' | 'BusinessAdmin' | 'BusinessLearner';
    status: 'Active' | 'Inactive';
    createdAt?: Timestamp;
    lastLogin?: Timestamp;

    // Professional Profile
    professionalProfile?: {
        summary?: string;
        skills?: string[];
        experience?: WorkExperience[];
        education?: Education[];
        certifications?: Certification[];
    };
};

export type WorkExperience = {
    id: string;
    role: string;
    company: string;
    startDate: string; // ISO string for simplicity in forms
    endDate?: string; // null/undefined for present
    current?: boolean;
    description: string;
    skills?: string[];
};

export type Education = {
    id: string;
    institution: string;
    degree: string;
    fieldOfStudy: string;
    startDate: string;
    endDate?: string;
    current?: boolean;
};

export type Certification = {
    id: string;
    name: string;
    issuer: string;
    issueDate: string;
    expiryDate?: string;
    credentialId?: string;
    credentialUrl?: string;
};
