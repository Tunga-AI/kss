import { Firestore, collection, setDoc, updateDoc, doc, getDoc, getDocs, query, where, orderBy, Timestamp, deleteDoc } from 'firebase/firestore';
import type { Assessment, AssessmentAttempt, CouncilReview } from './assessment-types';
import { generateId } from './id-generator';

// ============= ASSESSMENTS =============

export async function addAssessment(
    firestore: Firestore,
    assessment: Omit<Assessment, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
    const id = await generateId(firestore, 'assessments', 'ASS');
    const assessmentRef = doc(firestore, 'assessments', id);

    await setDoc(assessmentRef, {
        ...assessment,
        id,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
    });

    return id;
}

export async function updateAssessment(
    firestore: Firestore,
    id: string,
    updates: Partial<Omit<Assessment, 'id' | 'createdAt'>>
): Promise<void> {
    const assessmentRef = doc(firestore, 'assessments', id);
    await updateDoc(assessmentRef, {
        ...updates,
        updatedAt: Timestamp.now(),
    });
}

export async function deleteAssessment(
    firestore: Firestore,
    id: string
): Promise<void> {
    const assessmentRef = doc(firestore, 'assessments', id);
    await deleteDoc(assessmentRef);
}

export async function getAssessmentByProgramId(
    firestore: Firestore,
    programId: string
): Promise<Assessment | null> {
    const q = query(
        collection(firestore, 'assessments'),
        where('programId', '==', programId),
        where('status', '==', 'Active')
    );
    const snapshot = await getDocs(q);

    if (snapshot.empty) return null;

    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as Assessment;
}

// ============= ASSESSMENT ATTEMPTS =============

export async function startAssessment(
    firestore: Firestore,
    data: {
        assessmentId: string;
        assessmentTitle: string;
        userId: string;
        userName: string;
        userEmail: string;
        admissionId: string;
        programId?: string;
        programTitle?: string;
    }
): Promise<string> {
    const id = await generateId(firestore, 'assessment_attempts', 'ATT');
    const attemptRef = doc(firestore, 'assessment_attempts', id);

    // Filter out undefined values
    const cleanData = Object.fromEntries(
        Object.entries(data).filter(([_, value]) => value !== undefined)
    );

    await setDoc(attemptRef, {
        ...cleanData,
        id,
        answers: [],
        score: 0,
        totalPoints: 0,
        earnedPoints: 0,
        passed: false,
        startedAt: Timestamp.now(),
        status: 'In Progress',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
    });

    return id;
}

export async function submitAssessment(
    firestore: Firestore,
    attemptId: string,
    answers: { questionId: string; answer: string | number }[],
    score: number,
    totalPoints: number,
    earnedPoints: number,
    passed: boolean
): Promise<void> {
    const attemptRef = doc(firestore, 'assessment_attempts', attemptId);
    await updateDoc(attemptRef, {
        answers,
        score,
        totalPoints,
        earnedPoints,
        passed,
        completedAt: Timestamp.now(),
        status: 'Completed',
        updatedAt: Timestamp.now(),
    });
}

export async function getAssessmentAttempt(
    firestore: Firestore,
    attemptId: string
): Promise<AssessmentAttempt | null> {
    const attemptRef = doc(firestore, 'assessment_attempts', attemptId);
    const snapshot = await getDoc(attemptRef);

    if (!snapshot.exists()) return null;

    return { id: snapshot.id, ...snapshot.data() } as AssessmentAttempt;
}

export async function getUserAssessmentAttempts(
    firestore: Firestore,
    userId: string
): Promise<AssessmentAttempt[]> {
    const q = query(
        collection(firestore, 'assessment_attempts'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AssessmentAttempt));
}

export async function getAdmissionAssessmentAttempt(
    firestore: Firestore,
    admissionId: string
): Promise<AssessmentAttempt | null> {
    const q = query(
        collection(firestore, 'assessment_attempts'),
        where('admissionId', '==', admissionId),
        where('status', '==', 'Completed')
    );
    const snapshot = await getDocs(q);

    if (snapshot.empty) return null;

    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as AssessmentAttempt;
}

// ============= COUNCIL REVIEWS =============

export async function addCouncilReview(
    firestore: Firestore,
    review: Omit<CouncilReview, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
    const id = await generateId(firestore, 'council_reviews', 'REV');
    const reviewRef = doc(firestore, 'council_reviews', id);

    await setDoc(reviewRef, {
        ...review,
        id,
        reviewedAt: Timestamp.now(),
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
    });

    return id;
}

export async function getCouncilReview(
    firestore: Firestore,
    admissionId: string
): Promise<CouncilReview | null> {
    const q = query(
        collection(firestore, 'council_reviews'),
        where('admissionId', '==', admissionId)
    );
    const snapshot = await getDocs(q);

    if (snapshot.empty) return null;

    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as CouncilReview;
}

export async function getPendingReviews(
    firestore: Firestore
): Promise<Array<{ admission: any; attempt: AssessmentAttempt }>> {
    // Get admissions pending review
    const admissionsQuery = query(
        collection(firestore, 'admissions'),
        where('status', '==', 'Pending Review')
    );
    const admissionsSnapshot = await getDocs(admissionsQuery);

    const results = [];

    for (const admissionDoc of admissionsSnapshot.docs) {
        const admission = { id: admissionDoc.id, ...admissionDoc.data() };

        // Get assessment attempt for this admission
        const attempt = await getAdmissionAssessmentAttempt(firestore, admission.id);

        if (attempt) {
            results.push({ admission, attempt });
        }
    }

    return results;
}
