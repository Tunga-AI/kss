import {
    collection,
    doc,
    getDoc,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    Timestamp,
    writeBatch,
    type Firestore,
} from 'firebase/firestore';
import type {
    LearningCourse,
    LearningUnit,
    LearnerEnrollment,
    UnitProgress,
    FacilitatorAssignment,
} from './learning-types';
import { issueCertificate } from './certificates';

// ============================================================================
// Learning Courses
// ============================================================================

export async function createLearningCourse(
    firestore: Firestore,
    data: Omit<LearningCourse, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
    const courseData = {
        ...data,
        moduleIds: [],
        unitIds: [], // Legacy support
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
    };

    const docRef = await addDoc(collection(firestore, 'learningCourses'), courseData);
    return docRef.id;
}

export async function updateLearningCourse(
    firestore: Firestore,
    id: string,
    data: Partial<LearningCourse>
): Promise<void> {
    const docRef = doc(firestore, 'learningCourses', id);
    await updateDoc(docRef, {
        ...data,
        updatedAt: Timestamp.now(),
    });
}

export async function deleteLearningCourse(firestore: Firestore, id: string): Promise<void> {
    // Delete course and all related modules (stored in learningUnits collection)
    const modulesQuery = query(collection(firestore, 'learningUnits'), where('courseId', '==', id));
    const modulesSnapshot = await getDocs(modulesQuery);

    const batch = writeBatch(firestore);

    // Delete all modules
    modulesSnapshot.forEach((doc) => {
        batch.delete(doc.ref);
    });

    // Delete the course
    batch.delete(doc(firestore, 'learningCourses', id));

    await batch.commit();
}

export async function getLearningCourse(firestore: Firestore, id: string): Promise<LearningCourse | null> {
    const docRef = doc(firestore, 'learningCourses', id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) return null;

    return { id: docSnap.id, ...docSnap.data() } as LearningCourse;
}

export async function getLearningCoursesByCohort(firestore: Firestore, cohortId: string): Promise<LearningCourse[]> {
    const q = query(collection(firestore, 'learningCourses'), where('cohortId', '==', cohortId));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as LearningCourse));
}

export async function getLearningCoursesByProgram(firestore: Firestore, programId: string): Promise<LearningCourse[]> {
    const q = query(collection(firestore, 'learningCourses'), where('programId', '==', programId));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as LearningCourse));
}

export async function getAllLearningCourses(firestore: Firestore): Promise<LearningCourse[]> {
    const q = query(collection(firestore, 'learningCourses'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as LearningCourse));
}

/**
 * Duplicate a course with all its units
 * Optionally assign to a new cohort
 */
export async function duplicateLearningCourse(
    firestore: Firestore,
    sourceCourseId: string,
    newData: {
        title?: string;
        cohortId?: string;
        cohortName?: string;
        createdBy: string;
    }
): Promise<string> {
    // Get the source course
    const sourceCourse = await getLearningCourse(firestore, sourceCourseId);
    if (!sourceCourse) {
        throw new Error('Source course not found');
    }

    // Get all units from the source course
    const sourceUnits = await getLearningUnitsByCourse(firestore, sourceCourseId);

    // Create the new course
    const newCourseData = {
        title: newData.title || `${sourceCourse.title} (Copy)`,
        description: sourceCourse.description,
        programId: sourceCourse.programId,
        programTitle: sourceCourse.programTitle,
        cohortId: newData.cohortId,
        cohortName: newData.cohortName,
        unitIds: [] as string[],
        totalWeeks: sourceCourse.totalWeeks,
        status: 'Draft' as const,
        isPublished: false,
        isSelfPaced: sourceCourse.isSelfPaced,
        allowSkipUnits: sourceCourse.allowSkipUnits,
        sourceId: sourceCourseId,
        duplicatedFrom: sourceCourse.title,
        createdBy: newData.createdBy,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
    };

    const newCourseRef = await addDoc(collection(firestore, 'learningCourses'), newCourseData);
    const newCourseId = newCourseRef.id;

    // Duplicate all units
    const batch = writeBatch(firestore);
    const newUnitIds: string[] = [];

    for (const sourceUnit of sourceUnits) {
        const newUnitRef = doc(collection(firestore, 'learningUnits'));
        const newUnitData = {
            courseId: newCourseId,
            title: sourceUnit.title,
            description: sourceUnit.description,
            orderIndex: sourceUnit.orderIndex,
            weekNumber: sourceUnit.weekNumber,
            deliveryType: sourceUnit.deliveryType || 'Virtual',
            location: sourceUnit.location || null,
            facilitatorId: sourceUnit.facilitatorId || null,
            facilitatorName: sourceUnit.facilitatorName || null,
            facilitatorEmail: sourceUnit.facilitatorEmail || null,
            contentIds: sourceUnit.contentIds || [],
            status: 'Draft' as const,
            isRequired: sourceUnit.isRequired,
            passingScore: sourceUnit.passingScore,
            estimatedDuration: sourceUnit.estimatedDuration,
            createdBy: newData.createdBy,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
        };

        // Remove undefined fields
        Object.keys(newUnitData).forEach(key => {
            if (newUnitData[key as keyof typeof newUnitData] === undefined) {
                delete newUnitData[key as keyof typeof newUnitData];
            }
        });

        batch.set(newUnitRef, newUnitData);
        newUnitIds.push(newUnitRef.id);
    }

    // Update the new course with module IDs
    batch.update(doc(firestore, 'learningCourses', newCourseId), {
        moduleIds: newUnitIds,
        unitIds: newUnitIds, // Legacy support
        updatedAt: Timestamp.now(),
    });

    await batch.commit();

    return newCourseId;
}

/**
 * Allocate a course to a cohort
 */
export async function allocateCourseToChort(
    firestore: Firestore,
    courseId: string,
    cohortId: string,
    cohortName?: string
): Promise<void> {
    const courseRef = doc(firestore, 'learningCourses', courseId);
    const courseSnap = await getDoc(courseRef);

    if (!courseSnap.exists()) {
        throw new Error('Course not found');
    }

    const course = courseSnap.data() as LearningCourse;
    const allocatedCohortIds = course.allocatedCohortIds || [];

    // Add cohort if not already allocated
    if (!allocatedCohortIds.includes(cohortId)) {
        allocatedCohortIds.push(cohortId);
    }

    await updateDoc(courseRef, {
        cohortId,
        cohortName,
        allocatedCohortIds,
        updatedAt: Timestamp.now(),
    });
}

// ============================================================================
// Learning Units
// ============================================================================

export async function createLearningUnit(
    firestore: Firestore,
    data: Omit<LearningUnit, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
    const unitData = {
        ...data,
        contentIds: data.contentIds || [],
        deliveryType: data.deliveryType || 'Virtual',
        facilitatorId: data.facilitatorId || null,
        facilitatorName: data.facilitatorName || null,
        facilitatorEmail: data.facilitatorEmail || null,
        location: data.location || null,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
    };

    // Remove undefined fields to prevent Firestore errors
    Object.keys(unitData).forEach(key => {
        if (unitData[key as keyof typeof unitData] === undefined) {
            delete unitData[key as keyof typeof unitData];
        }
    });

    const docRef = await addDoc(collection(firestore, 'learningUnits'), unitData);

    // Update the course's unitIds array
    const courseRef = doc(firestore, 'learningCourses', data.courseId);
    const courseSnap = await getDoc(courseRef);

    let course: LearningCourse | null = null;
    if (courseSnap.exists()) {
        course = courseSnap.data() as LearningCourse;
        const moduleIds = [...(course.moduleIds || course.unitIds || []), docRef.id];
        await updateDoc(courseRef, {
            moduleIds,
            unitIds: moduleIds, // Legacy support
            updatedAt: Timestamp.now()
        });
    }

    // If facilitator is assigned, create assignment record
    if (data.facilitatorId && course) {
        await createFacilitatorAssignment(firestore, {
            facilitatorId: data.facilitatorId,
            facilitatorName: data.facilitatorName,
            facilitatorEmail: data.facilitatorEmail,
            moduleId: docRef.id,
            moduleTitle: data.title,
            unitId: docRef.id, // Legacy support
            unitTitle: data.title, // Legacy support
            courseId: data.courseId,
            courseTitle: course.title,
            cohortId: course.cohortId || '',
            cohortName: course.cohortName,
            programId: course.programId,
            programTitle: course.programTitle,
            assignedBy: data.createdBy,
            status: 'Active',
        });
    }

    return docRef.id;
}

export async function updateLearningUnit(
    firestore: Firestore,
    id: string,
    data: Partial<LearningUnit>
): Promise<void> {
    const docRef = doc(firestore, 'learningUnits', id);
    const currentDoc = await getDoc(docRef);

    if (!currentDoc.exists()) {
        throw new Error('Unit not found');
    }

    const currentData = currentDoc.data() as LearningUnit;

    // Check if facilitator changed
    if (data.facilitatorId && data.facilitatorId !== currentData.facilitatorId) {
        // Remove old assignment
        if (currentData.facilitatorId) {
            const oldAssignmentQuery = query(
                collection(firestore, 'facilitatorAssignments'),
                where('unitId', '==', id),
                where('facilitatorId', '==', currentData.facilitatorId)
            );
            const oldSnapshot = await getDocs(oldAssignmentQuery);
            oldSnapshot.forEach(async (doc) => {
                await updateDoc(doc.ref, { status: 'Cancelled', updatedAt: Timestamp.now() });
            });
        }

        // Get course for additional info
        const courseRef = doc(firestore, 'learningCourses', currentData.courseId);
        const courseSnap = await getDoc(courseRef);
        const course = courseSnap.exists() ? courseSnap.data() as LearningCourse : null;

        // Create new assignment
        await createFacilitatorAssignment(firestore, {
            facilitatorId: data.facilitatorId,
            facilitatorName: data.facilitatorName,
            facilitatorEmail: data.facilitatorEmail,
            moduleId: id,
            moduleTitle: data.title || currentData.title,
            unitId: id, // Legacy support
            unitTitle: data.title || currentData.title, // Legacy support
            courseId: currentData.courseId,
            courseTitle: course?.title,
            cohortId: course?.cohortId || '',
            cohortName: course?.cohortName,
            programId: course?.programId || '',
            programTitle: course?.programTitle,
            assignedBy: data.updatedBy || 'system',
            status: 'Active',
        });
    }

    await updateDoc(docRef, {
        ...data,
        updatedAt: Timestamp.now(),
    });
}

export async function deleteLearningUnit(firestore: Firestore, id: string): Promise<void> {
    const docRef = doc(firestore, 'learningUnits', id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) return;

    const unit = docSnap.data() as LearningUnit;

    // Remove unit ID from course
    const courseRef = doc(firestore, 'learningCourses', unit.courseId);
    const courseSnap = await getDoc(courseRef);

    if (courseSnap.exists()) {
        const course = courseSnap.data() as LearningCourse;
        const moduleIds = (course.moduleIds || course.unitIds || []).filter((uid) => uid !== id);
        await updateDoc(courseRef, {
            moduleIds,
            unitIds: moduleIds, // Legacy support
            updatedAt: Timestamp.now()
        });
    }

    // Delete facilitator assignments
    const assignmentQuery = query(collection(firestore, 'facilitatorAssignments'), where('unitId', '==', id));
    const assignmentSnapshot = await getDocs(assignmentQuery);
    assignmentSnapshot.forEach(async (doc) => {
        await deleteDoc(doc.ref);
    });

    // Delete the unit
    await deleteDoc(docRef);
}

export async function getLearningUnit(firestore: Firestore, id: string): Promise<LearningUnit | null> {
    const docRef = doc(firestore, 'learningUnits', id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) return null;

    return { id: docSnap.id, ...docSnap.data() } as LearningUnit;
}

export async function getLearningUnitsByCourse(firestore: Firestore, courseId: string): Promise<LearningUnit[]> {
    const q = query(
        collection(firestore, 'learningUnits'),
        where('courseId', '==', courseId),
        orderBy('orderIndex', 'asc')
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as LearningUnit));
}

export async function getLearningUnitsByFacilitator(firestore: Firestore, facilitatorId: string): Promise<LearningUnit[]> {
    const q = query(collection(firestore, 'learningUnits'), where('facilitatorId', '==', facilitatorId));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as LearningUnit));
}

// ============================================================================
// Learner Enrollments
// ============================================================================

export async function createLearnerEnrollment(
    firestore: Firestore,
    data: Omit<LearnerEnrollment, 'id' | 'createdAt' | 'updatedAt' | 'completedUnitIds' | 'overallProgress' | 'totalTimeSpent'>
): Promise<string> {
    const enrollmentData = {
        ...data,
        completedUnitIds: [],
        overallProgress: 0,
        totalTimeSpent: 0,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
    };

    const docRef = await addDoc(collection(firestore, 'learnerEnrollments'), enrollmentData);
    return docRef.id;
}

export async function updateLearnerEnrollment(
    firestore: Firestore,
    id: string,
    data: Partial<LearnerEnrollment>
): Promise<void> {
    const docRef = doc(firestore, 'learnerEnrollments', id);
    await updateDoc(docRef, {
        ...data,
        updatedAt: Timestamp.now(),
    });
}

export async function getLearnerEnrollment(firestore: Firestore, id: string): Promise<LearnerEnrollment | null> {
    const docRef = doc(firestore, 'learnerEnrollments', id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) return null;

    return { id: docSnap.id, ...docSnap.data() } as LearnerEnrollment;
}

export async function getLearnerEnrollmentsByCourse(
    firestore: Firestore,
    courseId: string
): Promise<LearnerEnrollment[]> {
    const q = query(collection(firestore, 'learnerEnrollments'), where('courseId', '==', courseId));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as LearnerEnrollment));
}

export async function getLearnerEnrollmentsByLearner(
    firestore: Firestore,
    learnerId: string
): Promise<LearnerEnrollment[]> {
    const q = query(collection(firestore, 'learnerEnrollments'), where('learnerId', '==', learnerId));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as LearnerEnrollment));
}

export async function getOrCreateEnrollment(
    firestore: Firestore,
    learnerId: string,
    courseId: string,
    cohortId: string,
    programId: string,
    learnerName?: string,
    learnerEmail?: string
): Promise<string> {
    // Check if enrollment exists
    const q = query(
        collection(firestore, 'learnerEnrollments'),
        where('learnerId', '==', learnerId),
        where('courseId', '==', courseId)
    );
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
        return snapshot.docs[0].id;
    }

    // Create new enrollment
    return await createLearnerEnrollment(firestore, {
        learnerId,
        learnerName,
        learnerEmail,
        courseId,
        cohortId,
        programId,
        status: 'Active',
        enrolledAt: Timestamp.now(),
    });
}

// ============================================================================
// Unit Progress
// ============================================================================

export async function createUnitProgress(
    firestore: Firestore,
    data: Omit<UnitProgress, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
    const progressData = {
        ...data,
        completedContentIds: data.completedContentIds || [],
        contentProgress: data.contentProgress || {},
        timeSpent: data.timeSpent || 0,
        attempts: data.attempts || 0,
        passed: data.passed || false,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
    };

    const docRef = await addDoc(collection(firestore, 'unitProgress'), progressData);
    return docRef.id;
}

export async function updateUnitProgress(
    firestore: Firestore,
    id: string,
    data: Partial<UnitProgress>
): Promise<void> {
    const docRef = doc(firestore, 'unitProgress', id);
    await updateDoc(docRef, {
        ...data,
        updatedAt: Timestamp.now(),
    });
}

export async function getUnitProgress(firestore: Firestore, id: string): Promise<UnitProgress | null> {
    const docRef = doc(firestore, 'unitProgress', id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) return null;

    return { id: docSnap.id, ...docSnap.data() } as UnitProgress;
}

export async function getUnitProgressByLearnerAndUnit(
    firestore: Firestore,
    learnerId: string,
    unitId: string
): Promise<UnitProgress | null> {
    const q = query(
        collection(firestore, 'unitProgress'),
        where('learnerId', '==', learnerId),
        where('unitId', '==', unitId)
    );
    const snapshot = await getDocs(q);

    if (snapshot.empty) return null;

    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as UnitProgress;
}

export async function getUnitProgressByEnrollment(
    firestore: Firestore,
    enrollmentId: string
): Promise<UnitProgress[]> {
    const q = query(collection(firestore, 'unitProgress'), where('enrollmentId', '==', enrollmentId));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as UnitProgress));
}

// ============================================================================
// Facilitator Assignments
// ============================================================================

async function createFacilitatorAssignment(
    firestore: Firestore,
    data: Omit<FacilitatorAssignment, 'id' | 'createdAt' | 'updatedAt' | 'assignedAt'>
): Promise<string> {
    const assignmentData = {
        ...data,
        assignedAt: Timestamp.now(),
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
    };

    const docRef = await addDoc(collection(firestore, 'facilitatorAssignments'), assignmentData);
    return docRef.id;
}

export async function getFacilitatorAssignments(
    firestore: Firestore,
    facilitatorId: string
): Promise<FacilitatorAssignment[]> {
    const q = query(
        collection(firestore, 'facilitatorAssignments'),
        where('facilitatorId', '==', facilitatorId),
        where('status', '==', 'Active')
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as FacilitatorAssignment));
}

export async function getAssignmentsByUnit(firestore: Firestore, unitId: string): Promise<FacilitatorAssignment[]> {
    const q = query(collection(firestore, 'facilitatorAssignments'), where('unitId', '==', unitId));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as FacilitatorAssignment));
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Reorder modules within a course
 */
export async function reorderModules(firestore: Firestore, courseId: string, moduleIds: string[]): Promise<void> {
    const batch = writeBatch(firestore);

    // Update each module's orderIndex
    moduleIds.forEach((moduleId, index) => {
        const moduleRef = doc(firestore, 'learningUnits', moduleId);
        batch.update(moduleRef, { orderIndex: index, updatedAt: Timestamp.now() });
    });

    // Update the course's moduleIds array
    const courseRef = doc(firestore, 'learningCourses', courseId);
    batch.update(courseRef, {
        moduleIds,
        unitIds: moduleIds, // Legacy support
        updatedAt: Timestamp.now()
    });

    await batch.commit();
}

// Legacy function alias
export const reorderUnits = reorderModules;

/**
 * Calculate and update overall progress for an enrollment
 */
export async function updateEnrollmentProgress(firestore: Firestore, enrollmentId: string): Promise<void> {
    const progressQuery = query(collection(firestore, 'unitProgress'), where('enrollmentId', '==', enrollmentId));
    const progressSnapshot = await getDocs(progressQuery);

    const allProgress = progressSnapshot.docs.map((doc) => doc.data() as UnitProgress);

    if (allProgress.length === 0) return;

    const totalProgress = allProgress.reduce((sum, p) => sum + p.progress, 0);
    const overallProgress = Math.round(totalProgress / allProgress.length);

    const totalTimeSpent = allProgress.reduce((sum, p) => sum + p.timeSpent, 0);

    const completedUnits = allProgress.filter((p) => p.status === 'Completed' || p.status === 'Passed');
    const completedUnitIds = completedUnits.map((p) => p.unitId);

    const totalScore = allProgress.filter((p) => p.score !== undefined).reduce((sum, p) => sum + (p.score || 0), 0);
    const averageScore = allProgress.filter((p) => p.score !== undefined).length > 0
        ? Math.round(totalScore / allProgress.filter((p) => p.score !== undefined).length)
        : 0;

    const enrollmentRef = doc(firestore, 'learnerEnrollments', enrollmentId);

    // Create update object with defined values
    const updateData: any = {
        overallProgress: overallProgress || 0,
        totalTimeSpent: totalTimeSpent || 0,
        completedModuleIds: completedUnitIds || [],
        completedUnitIds: completedUnitIds || [], // Legacy support
        averageScore: averageScore || 0,
        lastAccessedAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
    };

    await updateDoc(enrollmentRef, updateData);

    // Check if course is completed
    const enrollmentDoc = await getDoc(enrollmentRef);
    if (enrollmentDoc.exists()) {
        const enrollment = enrollmentDoc.data() as LearnerEnrollment;

        // Only proceed if not already completed
        if (enrollment.status !== 'Completed') {
            const courseDoc = await getDoc(doc(firestore, 'learningCourses', enrollment.courseId));

            if (courseDoc.exists()) {
                const course = courseDoc.data() as LearningCourse;
                const totalModules = (course.moduleIds || course.unitIds || []).length;
                if (completedUnitIds.length === totalModules && totalModules > 0) {
                    const completedAt = Timestamp.now();
                    await updateDoc(enrollmentRef, {
                        status: 'Completed',
                        completedAt,
                    });

                    // Auto-issue certificate for Core and Short program types
                    try {
                        const programDoc = await getDoc(doc(firestore, 'programs', course.programId));
                        const program = programDoc.exists() ? programDoc.data() : null;
                        const programType = program?.programType as string | undefined;

                        if (programType === 'Core' || programType === 'Short') {
                            // Check if certificate already exists for this enrollment
                            const existingCertQuery = query(
                                collection(firestore, 'certificates'),
                                where('courseId', '==', course.id),
                                where('learnerId', '==', enrollment.learnerId)
                            );
                            const existingCerts = await getDocs(existingCertQuery);

                            if (existingCerts.empty) {
                                await issueCertificate(firestore, {
                                    learnerId: enrollment.learnerId,
                                    learnerName: enrollment.learnerName || '',
                                    learnerEmail: enrollment.learnerEmail || '',
                                    programTitle: program?.title || course.programTitle || '',
                                    programType: programType as 'Core' | 'Short',
                                    programId: course.programId,
                                    courseTitle: course.title,
                                    courseId: course.id,
                                    cohortId: enrollment.cohortId,
                                    cohortName: course.cohortName,
                                    completedAt,
                                    isSystemGenerated: true,
                                });
                            }
                        }
                    } catch (certErr) {
                        console.error('Auto-certificate issuance error:', certErr);
                        // Non-fatal — completion still recorded
                    }
                }
            }
        }
    }
}
