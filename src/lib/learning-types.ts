import type { Timestamp } from 'firebase/firestore';

/**
 * Learning Course - The main container for structured learning
 * Can be created for a program and later allocated to cohorts
 */
export type LearningCourse = {
    id: string;
    title: string;
    description: string;

    // Core relationships
    programId: string;
    programTitle?: string; // Cached for display

    // Cohort allocation (optional - can be allocated later)
    cohortId?: string;
    cohortName?: string; // Cached for display
    allocatedCohortIds?: string[]; // Multiple cohorts can use this course

    // Corporate allocation (for Business/B2B programs)
    organizationId?: string;
    organizationName?: string;

    // Course structure
    moduleIds: string[]; // Ordered list of module IDs
    unitIds?: string[]; // Legacy - kept for backwards compatibility
    totalWeeks?: number; // Total number of weeks for the course

    // Settings
    status: 'Draft' | 'Active' | 'Completed' | 'Archived';
    isPublished: boolean;

    // Self-paced settings (for e-learning)
    isSelfPaced: boolean;
    allowSkipUnits: boolean; // If false, must complete units in order

    // Duplication tracking
    sourceId?: string; // If duplicated, ID of the source course
    duplicatedFrom?: string; // Title of source course for reference

    // Metadata
    createdAt: Timestamp;
    updatedAt: Timestamp;
    createdBy: string;
    updatedBy?: string;

    // E-Learning & MOOC fields
    price?: number;
    currency?: string;
    isFree?: boolean;
    thumbnailUrl?: string;
    level?: 'Beginner' | 'Intermediate' | 'Advanced';
    category?: string;
};

/**
 * Delivery Type for units
 */
export type DeliveryType = 'Virtual' | 'Physical' | 'Hybrid' | 'Self-paced';

/**
 * Timing Type - How units are scheduled/organized
 */
export type TimingType = 'Session' | 'Day' | 'Week' | 'Module';

/**
 * Learning Module - Individual module/class within a course
 * Contains content and facilitator assignment
 */
export type LearningModule = {
    id: string;
    courseId: string;

    // Module details
    title: string;
    description: string;
    orderIndex: number; // For sequencing within the course

    // Flexible timing - can be Session 1, Day 1, Week 1, Module 1
    timingType?: TimingType; // Default: 'Week'
    timingNumber?: number; // The number (1, 2, 3, etc.)
    weekNumber?: number; // Legacy - kept for backwards compatibility

    // Delivery settings
    deliveryType: DeliveryType; // How the module is delivered
    location?: string; // For physical sessions, the location

    // Facilitator assignment
    facilitatorId?: string;
    facilitatorName?: string; // Cached for display
    facilitatorEmail?: string; // Cached for display

    // Content from library
    contentIds: string[]; // References to ContentItem IDs

    // Schedule (optional - for live sessions)
    scheduledStartDate?: Timestamp;
    scheduledEndDate?: Timestamp;
    duration?: number; // in minutes
    estimatedDuration?: number; // Estimated time to complete in minutes

    // Live session integration (optional)
    classroomSessionId?: string; // Link to ClassroomSession if live

    // Settings
    status: 'Draft' | 'Scheduled' | 'In Progress' | 'Completed';
    isRequired: boolean; // Must complete to progress

    // Requirements
    passingScore?: number; // Minimum score to pass (percentage)

    // Metadata
    createdAt: Timestamp;
    updatedAt: Timestamp;
    createdBy: string;
    updatedBy?: string;
};

// Legacy type alias for backwards compatibility
export type LearningUnit = LearningModule;

/**
 * Learner Enrollment - Tracks a learner's enrollment in a course
 */
export type LearnerEnrollment = {
    id: string;
    learnerId: string;
    learnerName?: string;
    learnerEmail?: string;

    courseId: string;
    cohortId: string;
    programId: string;

    // Enrollment status
    status: 'Active' | 'Completed' | 'Dropped' | 'Suspended';
    enrolledAt: Timestamp;
    completedAt?: Timestamp;

    // Progress tracking
    completedModuleIds: string[];
    completedUnitIds?: string[]; // Legacy - kept for backwards compatibility
    currentModuleId?: string;
    currentUnitId?: string; // Legacy - kept for backwards compatibility
    overallProgress: number; // 0-100 percentage

    // Performance
    averageScore?: number;
    totalTimeSpent: number; // in seconds

    // Timestamps
    lastAccessedAt?: Timestamp;

    // Metadata
    createdAt: Timestamp;
    updatedAt: Timestamp;
};

/**
 * Module Progress - Tracks a learner's progress in a specific module
 */
export type ModuleProgress = {
    id: string;
    moduleId: string;
    unitId?: string; // Legacy - kept for backwards compatibility
    learnerId: string;
    courseId: string;
    enrollmentId: string;

    // Progress
    status: 'Not Started' | 'In Progress' | 'Completed' | 'Passed' | 'Failed';
    progress: number; // 0-100 percentage
    score?: number;

    // Content completion tracking
    completedContentIds: string[]; // Which content items have been completed
    contentProgress: {
        [contentId: string]: {
            status: 'not-started' | 'in-progress' | 'completed';
            progress: number;
            score?: number;
            timeSpent: number; // seconds
            lastAccessedAt?: Timestamp;
        };
    };

    // Time tracking
    timeSpent: number; // in seconds
    startedAt?: Timestamp;
    completedAt?: Timestamp;
    lastAccessedAt?: Timestamp;

    // Assessment/Quiz results
    attempts: number;
    bestScore?: number;
    passed: boolean;

    // Metadata
    createdAt: Timestamp;
    updatedAt: Timestamp;
};

// Legacy type alias for backwards compatibility
export type UnitProgress = ModuleProgress;

/**
 * Facilitator Module Assignment - Tracks facilitator assignments to modules
 * Useful for querying which modules a facilitator is teaching
 */
export type FacilitatorAssignment = {
    id: string;
    facilitatorId: string;
    facilitatorName?: string;
    facilitatorEmail?: string;

    moduleId: string;
    moduleTitle?: string;
    unitId?: string; // Legacy - kept for backwards compatibility
    unitTitle?: string; // Legacy - kept for backwards compatibility

    courseId: string;
    courseTitle?: string;

    cohortId: string;
    cohortName?: string;

    programId: string;
    programTitle?: string;

    // Assignment details
    assignedAt: Timestamp;
    assignedBy: string;

    // Status
    status: 'Active' | 'Completed' | 'Cancelled';

    // Metadata
    createdAt: Timestamp;
    updatedAt: Timestamp;
};

/**
 * Learning Analytics - Aggregated stats for courses
 */
export type LearningAnalytics = {
    courseId: string;
    date: string; // YYYY-MM-DD

    // Enrollment metrics
    totalEnrolled: number;
    activeEnrollments: number;
    completedEnrollments: number;
    droppedEnrollments: number;

    // Progress metrics
    averageProgress: number;
    averageScore: number;
    completionRate: number;

    // Engagement metrics
    totalTimeSpent: number;
    averageTimeSpent: number;
    activeLearnersToday: number;

    // Module-specific metrics
    moduleMetrics: {
        [moduleId: string]: {
            completionRate: number;
            averageScore: number;
            averageTimeSpent: number;
        };
    };
    // Legacy - kept for backwards compatibility
    unitMetrics?: {
        [unitId: string]: {
            completionRate: number;
            averageScore: number;
            averageTimeSpent: number;
        };
    };
};
