'use server';

import { z } from 'zod';
import { initializeFirebase } from '@/firebase';
import { addUser } from '@/lib/users';
import { collection, getDocs, query, where } from 'firebase/firestore';

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  organizationId: z.string().min(1, 'Organization ID is required'),
});

export async function addBusinessLearner(formData: FormData) {
  const validatedFields = schema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
    return { success: false, error: 'Invalid form data.' };
  }
  
  const { name, email, organizationId } = validatedFields.data;
  const { firestore } = initializeFirebase();

  try {
    // Check if user already exists
    const usersRef = collection(firestore, 'users');
    const q = query(usersRef, where('email', '==', email));
    const existingUserSnapshot = await getDocs(q);
    if (!existingUserSnapshot.empty) {
        return { success: false, error: 'A user with this email already exists.' };
    }

    // Add user as a BusinessLearner
    await addUser(firestore, {
      name,
      email,
      role: 'BusinessLearner',
      status: 'Active',
      organizationId,
    });
    
    return { success: true };

  } catch (error: any) {
    console.error('Add Business Learner Error:', error);
    return { success: false, error: 'Failed to add learner.' };
  }
}
