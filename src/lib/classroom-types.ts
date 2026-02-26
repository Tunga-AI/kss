import type { Timestamp } from 'firebase/firestore';

export type ClassroomSession = {
    id: string;
    title: string;
    description: string;
    programId: string;
    cohortId?: string; // Optional for now to support legacy sessions, but should be required for new ones ideally
    facilitatorId?: string;
    startDateTime: Timestamp;
    endDateTime: Timestamp;
    status: 'Scheduled' | 'In Progress' | 'Completed' | 'Cancelled';
    type?: 'Virtual' | 'Physical' | 'Hybrid';
    location?: string; // Physical location address or room
    googleMeetLink?: string; // URL for Google Meet
    unitId?: string; // Associated Unit ID
    resourceIds?: string[]; // IDs from the content library
    // LiveKit room data
    liveKitRoomName?: string;
    liveKitRoomId?: string;
    isLive?: boolean;
    recordingEnabled?: boolean;
};

export type SessionParticipant = {
    id: string;
    sessionId: string;
    userId: string;
    userName: string;
    userEmail: string;
    role: 'instructor' | 'learner';
    joinedAt: Timestamp;
    leftAt?: Timestamp;
    duration?: number; // in seconds
    isOnline: boolean;
};

export type SharedDocument = {
    id: string;
    sessionId: string;
    fileName: string;
    fileUrl: string;
    fileType: string;
    fileSize: number;
    uploadedBy: string;
    uploadedByName: string;
    uploadedAt: Timestamp;
    sharedToClass: boolean;
};

export type Quiz = {
    id: string;
    sessionId: string;
    question: string;
    options: string[];
    correctAnswer?: number; // index of correct option (if provided)
    type: 'poll' | 'quiz';
    createdBy: string;
    createdAt: Timestamp;
    endsAt?: Timestamp;
    isActive: boolean;
};

export type QuizResponse = {
    id: string;
    quizId: string;
    sessionId: string;
    userId: string;
    userName: string;
    selectedOption: number;
    submittedAt: Timestamp;
    isCorrect?: boolean;
};

export type ChatMessage = {
    id: string;
    sessionId: string;
    userId: string;
    userName: string;
    message: string;
    timestamp: Timestamp;
    type: 'text' | 'system';
};
