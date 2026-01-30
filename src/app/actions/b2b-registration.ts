'use server';

import { z } from 'zod';
import { initializeFirebase } from '@/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { addDoc, collection, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { addUser } from '@/lib/users';

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  companyName: z.string().min(1, 'Company name is required'),
  tier: z.string(),
});

export async function b2bRegister(formData: FormData) {
  const validatedFields = schema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
    return { success: false, error: 'Invalid form data.' };
  }

  const { name, email, password, companyName, tier } = validatedFields.data;
  const { auth, firestore } = initializeFirebase();

  try {
    // 1. Create Firebase Auth user
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);

    // 2. Create the Organization document
    const orgRef = await addDoc(collection(firestore, 'organizations'), {
      name: companyName,
      adminId: '', // will be updated shortly
      tier: tier,
      status: 'Trial',
      maxLearners: 10, // Default for startup, can be adjusted
      createdAt: serverTimestamp(),
    });

    // 3. Create the User document (BusinessAdmin)
    const userRef = await addUser(firestore, {
      name,
      email,
      role: 'BusinessAdmin',
      status: 'Active',
      organizationId: orgRef.id,
    });
    
    // 4. Update the Organization with the BusinessAdmin's user document ID
    await updateDoc(orgRef, {
        adminId: userRef.id,
    });

    return { success: true };

  } catch (error: any) {
    let errorMessage = 'An unexpected error occurred.';
    if (error.code === 'auth/email-already-in-use') {
      errorMessage = 'This email address is already in use. Please try another one.';
    }
    console.error('B2B Registration Error:', error);
    return { success: false, error: errorMessage };
  }
}
