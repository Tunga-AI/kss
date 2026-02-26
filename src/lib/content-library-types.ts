import { Timestamp } from 'firebase/firestore';

export type ContentType = 'video' | 'document' | 'scorm' | 'h5p' | 'xapi' | 'image' | 'audio';

export type ContentStatus = 'draft' | 'published' | 'archived';

export interface ContentFolder {
    id: string;
    name: string;
    description?: string;
    parentId?: string; // For nested folders
    createdAt: Timestamp;
    updatedAt: Timestamp;
    createdBy: string;
}

export interface ContentCategory {
    id: string;
    name: string;
    description?: string;
    color?: string;
    icon?: string;
}

export interface ContentItem {
    id: string;
    title: string;
    description: string;
    type: ContentType;
    status: ContentStatus;

    // File information
    fileUrl: string;
    fileName: string;
    fileSize: number; // in bytes
    mimeType: string;
    thumbnailUrl?: string;

    // Organization
    folderId?: string;
    categories: string[]; // Array of category IDs
    tags: string[];

    // SCORM specific fields
    scormData?: {
        version: '1.2' | '2004';
        manifestUrl: string;
        launchUrl: string;
        identifier: string;
        // SCORM metadata
        mastery_score?: number;
        max_time_allowed?: string;
        time_limit_action?: 'exit,message' | 'exit,no message' | 'continue,message' | 'continue,no message';
    };

    // H5P/xAPI specific fields
    h5pData?: {
        libraryId: string;
        contentId: string;
    };

    // Video specific fields
    videoData?: {
        duration: number; // in seconds
        resolution?: string;
        subtitles?: Array<{
            language: string;
            url: string;
        }>;
    };

    // Permissions
    visibility: 'public' | 'restricted' | 'private';
    allowedRoles?: string[]; // Which roles can access this content
    allowedPrograms?: string[]; // Which programs can use this content

    // Metadata
    createdAt: Timestamp;
    updatedAt: Timestamp;
    createdBy: string;
    updatedBy?: string;
    version: number;

    // Usage tracking
    viewCount: number;
    downloadCount: number;
    usedInCourses: string[]; // Array of program IDs using this content
}

export interface SCORMAttempt {
    id: string;
    contentId: string;
    learnerId: string;
    sessionId: string;

    // SCORM 1.2 Core Data
    cmi: {
        core: {
            student_id: string;
            student_name: string;
            lesson_location: string;
            credit: 'credit' | 'no-credit';
            lesson_status: 'passed' | 'completed' | 'failed' | 'incomplete' | 'browsed' | 'not attempted';
            entry: 'ab-initio' | 'resume' | '';
            score_raw?: number;
            score_max?: number;
            score_min?: number;
            total_time: string; // Format: HHHH:MM:SS.SS
            lesson_mode: 'browse' | 'normal' | 'review';
            exit: 'time-out' | 'suspend' | 'logout' | '';
            session_time: string; // Format: HHHH:MM:SS.SS
        };
        suspend_data?: string;
        launch_data?: string;
        comments?: string;
        comments_from_lms?: string;

        objectives?: {
            _count: number;
            [key: string]: any;
        };

        student_data?: {
            mastery_score?: number;
            max_time_allowed?: string;
            time_limit_action?: string;
        };

        student_preference?: {
            audio?: number;
            language?: string;
            speed?: number;
            text?: number;
        };

        interactions?: {
            _count: number;
            [key: string]: any;
        };
    };

    // Timestamps
    startedAt: Timestamp;
    lastAccessedAt: Timestamp;
    completedAt?: Timestamp;

    // Summary data
    timeSpent: number; // in seconds
    progress: number; // percentage 0-100
    passed: boolean;
    score?: number;

    // Metadata
    userAgent?: string;
    ipAddress?: string;
}

export interface ContentProgress {
    id: string;
    contentId: string;
    learnerId: string;
    programId?: string; // If accessed through a program

    // Progress tracking
    status: 'not-started' | 'in-progress' | 'completed' | 'passed' | 'failed';
    progress: number; // 0-100
    score?: number;

    // Time tracking
    timeSpent: number; // in seconds
    lastPosition?: string; // For videos: timestamp, for SCORM: location

    // SCORM specific
    scormAttemptIds?: string[]; // References to SCORM attempts
    currentAttemptId?: string;

    // Timestamps
    startedAt: Timestamp;
    lastAccessedAt: Timestamp;
    completedAt?: Timestamp;

    // Metadata
    attempts: number;
    bestScore?: number;
}

export interface ContentUsageAnalytics {
    contentId: string;
    date: string; // YYYY-MM-DD

    // Usage metrics
    views: number;
    uniqueViewers: number;
    downloads: number;
    completions: number;
    averageScore: number;
    averageTimeSpent: number;

    // Engagement metrics
    dropOffRate: number; // percentage
    completionRate: number; // percentage
    passRate: number; // percentage
}

// ── Rich Course Content Types ─────────────────────────
export type ContentBlockType = 'text' | 'heading' | 'video' | 'image' | 'quiz' | 'code' | 'embed' | 'divider' | 'callout' | 'attachment';

export interface QuizOption {
    id: string;
    text: string;
    isCorrect: boolean;
}

export interface QuizQuestion {
    id: string;
    question: string;
    type: 'multiple-choice' | 'true-false' | 'short-answer';
    options: QuizOption[];
    explanation?: string;
    points: number;
}

export interface ContentBlock {
    id: string;
    type: ContentBlockType;
    order: number;

    // Text / Heading
    content?: string; // HTML or markdown content
    headingLevel?: 1 | 2 | 3;

    // Video
    videoUrl?: string;
    videoDuration?: number;

    // Image
    imageUrl?: string;
    imageAlt?: string;
    imageCaption?: string;

    // Quiz
    quizQuestions?: QuizQuestion[];
    quizTitle?: string;

    // Code
    codeContent?: string;
    codeLanguage?: string;

    // Embed
    embedUrl?: string;
    embedType?: 'youtube' | 'vimeo' | 'iframe' | 'other';

    // Callout
    calloutType?: 'info' | 'warning' | 'success' | 'tip';
    calloutTitle?: string;

    // Attachment
    attachmentUrl?: string;
    attachmentName?: string;
    attachmentSize?: number;
}

export interface CourseSection {
    id: string;
    title: string;
    description?: string;
    order: number;
    blocks: ContentBlock[];
    isCollapsed?: boolean;
    duration?: number; // estimated minutes
}

export interface CourseContent {
    id: string;
    title: string;
    description: string;
    coverImageUrl?: string;
    status: ContentStatus;
    type: 'course'; // distinguishes from file-based content

    // Course structure
    sections: CourseSection[];

    // Metadata
    tags: string[];
    categories: string[];
    visibility: 'public' | 'restricted' | 'private';
    difficulty?: 'beginner' | 'intermediate' | 'advanced';
    estimatedDuration?: number; // total minutes
    objectives?: string[]; // learning objectives

    // Timestamps
    createdAt: Timestamp;
    updatedAt: Timestamp;
    lastAutoSavedAt?: Timestamp;
    createdBy: string;
    updatedBy?: string;
    version: number;

    // Usage tracking
    viewCount: number;
    enrollmentCount: number;
    completionCount: number;
    averageRating?: number;
}
