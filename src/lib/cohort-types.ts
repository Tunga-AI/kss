/**
 * Program-specific settings within a cohort
 * Each program can have its own council, instructors, and assessment
 */
export type ProgramSettings = {
    programId: string;
    council: string[]; // Review council for this specific program
    instructors: string[]; // Instructors for this specific program
    assessmentId?: string; // Assessment for this specific program
};

export type Cohort = {
    id: string;
    name: string;
    status: 'Accepting Applications' | 'In Review' | 'Closed';

    // Global fields (apply to all programs in cohort)
    council?: string[]; // Global admissions council
    assessmentId?: string; // Global assessment (optional override)
    instructors?: string[]; // Global facilitators/instructors

    // Program assignment - supports multiple programs
    programIds: string[]; // Array of program IDs this cohort supports
    programId?: string; // Legacy - kept for backwards compatibility (first program in array)

    // Program-specific settings
    programSettings?: Record<string, ProgramSettings>; // Key is programId

    startDate?: string; // ISO date string e.g. "2025-03-01"
    endDate?: string; // ISO date string
    description?: string; // Short description for public display
};
