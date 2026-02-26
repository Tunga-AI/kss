'use client';

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  Firestore,
  updateDoc,
  query,
  where,
  getDocs,
  Timestamp,
} from 'firebase/firestore';
import type { FeedbackCycle, FeedbackResponse, FeedbackAnalytics } from './feedback-types';

// Feedback Cycle CRUD operations
export async function addFeedbackCycle(db: Firestore, cycle: Omit<FeedbackCycle, 'id'>) {
  return addDoc(collection(db, 'feedbackCycles'), cycle);
}

export async function updateFeedbackCycle(
  db: Firestore,
  cycleId: string,
  cycle: Partial<FeedbackCycle>
) {
  const cycleRef = doc(db, 'feedbackCycles', cycleId);
  return updateDoc(cycleRef, { ...cycle, updatedAt: Timestamp.now() });
}

export async function deleteFeedbackCycle(db: Firestore, cycleId: string) {
  const cycleRef = doc(db, 'feedbackCycles', cycleId);
  return deleteDoc(cycleRef);
}

// Feedback Response CRUD operations
export async function addFeedbackResponse(db: Firestore, response: Omit<FeedbackResponse, 'id'>) {
  return addDoc(collection(db, 'feedbackResponses'), response);
}

export async function updateFeedbackResponse(
  db: Firestore,
  responseId: string,
  response: Partial<FeedbackResponse>
) {
  const responseRef = doc(db, 'feedbackResponses', responseId);
  return updateDoc(responseRef, response);
}

export async function deleteFeedbackResponse(db: Firestore, responseId: string) {
  const responseRef = doc(db, 'feedbackResponses', responseId);
  return deleteDoc(responseRef);
}

// Analytics and reporting functions
export async function calculateFeedbackAnalytics(
  db: Firestore,
  cycleId: string
): Promise<FeedbackAnalytics> {
  const responsesQuery = query(
    collection(db, 'feedbackResponses'),
    where('feedbackCycleId', '==', cycleId)
  );
  const responsesSnapshot = await getDocs(responsesQuery);
  const responses = responsesSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as FeedbackResponse[];

  const analytics: FeedbackAnalytics = {
    feedbackCycleId: cycleId,
    totalResponses: responses.length,
    completionRate: 0, // Will need target audience count to calculate
    averageRatings: {},
    responsesByQuestion: {},
    textResponses: {},
    multipleChoiceDistribution: {},
    responsesByDate: {},
  };

  // Calculate analytics from responses
  responses.forEach((response) => {
    // Group by date
    const date = response.submittedAt.toDate().toISOString().split('T')[0];
    analytics.responsesByDate[date] = (analytics.responsesByDate[date] || 0) + 1;

    // Process each answer
    response.answers.forEach((answer) => {
      const questionId = answer.questionId;

      // Initialize question analytics if not exists
      if (!analytics.responsesByQuestion[questionId]) {
        analytics.responsesByQuestion[questionId] = [];
      }

      analytics.responsesByQuestion[questionId].push(answer.answer);

      // Calculate ratings
      if (typeof answer.answer === 'number') {
        if (!analytics.averageRatings[questionId]) {
          analytics.averageRatings[questionId] = 0;
        }
        const currentTotal = analytics.averageRatings[questionId] *
          (analytics.responsesByQuestion[questionId].length - 1);
        analytics.averageRatings[questionId] =
          (currentTotal + answer.answer) / analytics.responsesByQuestion[questionId].length;
      }

      // Collect text responses
      if (typeof answer.answer === 'string' && answer.answer.length > 0) {
        if (!analytics.textResponses[questionId]) {
          analytics.textResponses[questionId] = [];
        }
        analytics.textResponses[questionId].push(answer.answer);
      }

      // Calculate multiple choice distribution
      if (typeof answer.answer === 'string') {
        if (!analytics.multipleChoiceDistribution[questionId]) {
          analytics.multipleChoiceDistribution[questionId] = {};
        }
        analytics.multipleChoiceDistribution[questionId][answer.answer] =
          (analytics.multipleChoiceDistribution[questionId][answer.answer] || 0) + 1;
      }
    });
  });

  return analytics;
}

// Check if user has already responded to a feedback cycle
export async function hasUserResponded(
  db: Firestore,
  cycleId: string,
  userId: string
): Promise<boolean> {
  const responsesQuery = query(
    collection(db, 'feedbackResponses'),
    where('feedbackCycleId', '==', cycleId),
    where('respondentId', '==', userId)
  );
  const snapshot = await getDocs(responsesQuery);
  return !snapshot.empty;
}

// Get feedback cycles for a specific user (based on target audience)
export async function getFeedbackCyclesForUser(
  db: Firestore,
  userId: string,
  userRole: string
): Promise<FeedbackCycle[]> {
  const now = Timestamp.now();

  // Get all active feedback cycles
  const cyclesQuery = query(
    collection(db, 'feedbackCycles'),
    where('status', '==', 'active')
  );

  const snapshot = await getDocs(cyclesQuery);
  const allCycles = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as FeedbackCycle[];

  // Filter cycles based on target audience and date range
  return allCycles.filter((cycle) => {
    // Check if cycle is within date range
    if (cycle.startDate > now || cycle.endDate < now) {
      return false;
    }

    // Check target audience
    if (cycle.targetAudience === 'all') return true;
    if (cycle.targetAudience === 'learners' && userRole === 'Learner') return true;
    if (cycle.targetAudience === 'instructors' && userRole === 'Facilitator') return true;
    if (cycle.targetAudience === 'specific' && cycle.specificUserIds?.includes(userId)) {
      return true;
    }

    return false;
  });
}
