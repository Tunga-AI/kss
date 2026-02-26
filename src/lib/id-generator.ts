import { doc, runTransaction, Firestore } from 'firebase/firestore';

/**
 * Generates a unique sequential ID based on a prefix and a counter document.
 * The counter document is stored in the 'counters' collection.
 * 
 * @param db Firestore instance
 * @param counterName The name of the document in 'counters' collection (e.g., 'programs', 'learners')
 * @param prefix The prefix for the ID (e.g., 'P', 'L')
 * @returns A string ID like 'P-1', 'L-100'
 */
export async function generateId(db: Firestore, counterName: string, prefix: string): Promise<string> {
    const counterRef = doc(db, 'counters', counterName);

    try {
        const nextCount = await runTransaction(db, async (transaction) => {
            const counterDoc = await transaction.get(counterRef);
            let count = 1;

            if (counterDoc.exists()) {
                const data = counterDoc.data();
                if (data && typeof data.count === 'number') {
                    count = data.count + 1;
                }
            }

            transaction.set(counterRef, { count }, { merge: true });
            return count;
        });

        return `${prefix}${nextCount}`;
    } catch (error) {
        console.error(`Error generating ID for ${counterName}:`, error);
        // In case of error (e.g. offline), fallback to a simplified random-like string with prefix
        // to avoid complete failure, but uniqueness isn't guaranteed sequentially.
        // However, for critical IDs, we usually want it to fail or retry.
        // For now, rethrow so the UI handles the error.
        throw error;
    }
}
