'use server';

import { doc, updateDoc } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';
import type { Organization } from '@/lib/organization-types';

export async function updateOrganizationStatus(orgId: string, newStatus: Organization['status']) {
    if (!orgId || !newStatus) {
        return { success: false, error: "Missing organization ID or status." };
    }

    const { firestore } = initializeFirebase();
    const orgRef = doc(firestore, 'organizations', orgId);

    try {
        await updateDoc(orgRef, { status: newStatus });
        return { success: true };
    } catch (error) {
        console.error("Error updating organization status:", error);
        return { success: false, error: "Failed to update organization status." };
    }
}
