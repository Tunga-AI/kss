'use server';

import { z } from 'zod';
import { initializeFirebase } from '@/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { addDoc, collection, updateDoc, serverTimestamp } from 'firebase/firestore';
import { addUser } from '@/lib/users';
import { addMonths } from 'date-fns';

const schema = z.object({
    companyName: z.string().min(1, 'Company name is required'),
    adminName: z.string().min(1, 'Admin name is required'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    tier: z.enum(['Startup', 'SME', 'Corporate']),
    maxLearners: z.number().int().min(1),
    period: z.number().int().min(1), // months
    status: z.enum(['Active', 'Trial', 'Expired', 'Cancelled']),
});

export async function createBusinessManually(data: unknown) {
    const parsed = schema.safeParse(data);

    if (!parsed.success) {
        const firstError = parsed.error.errors[0]?.message || 'Invalid data.';
        return { success: false, error: firstError };
    }

    const { companyName, adminName, email, password, tier, maxLearners, period, status } = parsed.data;
    const { auth, firestore } = initializeFirebase();

    try {
        // 1. Create Firebase Auth user
        await createUserWithEmailAndPassword(auth, email, password);

        // 2. Calculate subscription end date
        const subscriptionEndDate = addMonths(new Date(), period);

        // 3. Create Organization document
        const orgRef = await addDoc(collection(firestore, 'organizations'), {
            name: companyName,
            adminId: '',
            tier,
            status,
            maxLearners,
            createdAt: serverTimestamp(),
            subscriptionEndDate,
            isSetupComplete: false,
        });

        // 4. Create BusinessAdmin user
        const userId = await addUser(firestore, {
            name: adminName,
            email,
            role: 'BusinessAdmin',
            status: 'Active',
            organizationId: orgRef.id,
        });

        // 5. Link admin back to org
        await updateDoc(orgRef, { adminId: userId });

        return { success: true, orgId: orgRef.id };

    } catch (error: any) {
        let errorMessage = 'An unexpected error occurred.';
        if (error.code === 'auth/email-already-in-use') {
            errorMessage = 'This email is already registered. Use a different email.';
        }
        console.error('Create Business Error:', error);
        return { success: false, error: errorMessage };
    }
}
