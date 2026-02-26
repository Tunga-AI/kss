import { Firestore, collection, query, where, getDocs, limit } from 'firebase/firestore';

/**
 * Check if a user with the given email already exists in the users collection
 * @param firestore Firestore instance
 * @param email Email to check
 * @returns User document if exists, null otherwise
 */
export async function checkUserExists(firestore: Firestore, email: string) {
    try {
        const usersRef = collection(firestore, 'users');
        const q = query(usersRef, where('email', '==', email.toLowerCase()), limit(1));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            const userDoc = querySnapshot.docs[0];
            return {
                id: userDoc.id,
                ...userDoc.data()
            };
        }

        return null;
    } catch (error) {
        console.error('Error checking user existence:', error);
        return null;
    }
}

/**
 * Check if a user has any existing admissions
 * @param firestore Firestore instance
 * @param userId User ID to check
 * @returns Admission document if exists, null otherwise
 */
export async function checkUserAdmission(firestore: Firestore, userId: string) {
    try {
        const admissionsRef = collection(firestore, 'admissions');
        const q = query(admissionsRef, where('userId', '==', userId), limit(1));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            const admissionDoc = querySnapshot.docs[0];
            return {
                id: admissionDoc.id,
                ...admissionDoc.data()
            };
        }

        return null;
    } catch (error) {
        console.error('Error checking user admission:', error);
        return null;
    }
}
