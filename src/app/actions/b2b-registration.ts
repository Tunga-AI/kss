
import { z } from 'zod';
import { initializeFirebase } from '@/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { addDoc, collection, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { addUser } from '@/lib/users';
import { addTransaction } from '@/lib/transactions';
import { addMonths } from 'date-fns';

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  companyName: z.string().min(1, 'Company name is required'),
  tier: z.string(),
  numLearners: z.number().int().min(1),
  period: z.number().int(),
  amount: z.number(),
  paymentReference: z.string(),
});

export async function completeB2bRegistration(data: unknown) {
  const validatedFields = schema.safeParse(data);

  if (!validatedFields.success) {
    console.error("B2B Registration Validation Error:", validatedFields.error);
    return { success: false, error: 'Invalid data received. Please try again.' };
  }

  const { name, email, password, companyName, tier, numLearners, period, amount, paymentReference } = validatedFields.data;
  const { auth, firestore } = initializeFirebase();

  // Determine max learners based on tier
  const tierMaxLearners: Record<string, number> = {
    Startup: 5,
    SME: 20,
    Corporate: 999,
  };
  const maxLearners = tierMaxLearners[tier] ?? numLearners;

  try {
    // 1. Create Firebase Auth user
    await createUserWithEmailAndPassword(auth, email, password);

    // 2. Calculate subscription end date
    const subscriptionEndDate = addMonths(new Date(), period);

    // 3. Create the Organization document
    const orgRef = await addDoc(collection(firestore, 'organizations'), {
      name: companyName,
      adminId: '', // will be updated shortly
      tier: tier,
      status: 'Active',
      maxLearners: maxLearners,
      createdAt: serverTimestamp(),
      subscriptionEndDate: subscriptionEndDate,
      subscriptionPeriod: period,
      totalSubscriptionAmount: amount,
      paymentReference: paymentReference,
      isSetupComplete: false, // Prompt to complete setup on first login
    });

    // 4. Create the User document (BusinessAdmin)
    const userRef = await addUser(firestore, {
      name,
      email,
      role: 'BusinessAdmin',
      status: 'Active',
      organizationId: orgRef.id,
    });

    // 5. Update the Organization with the BusinessAdmin's user document ID
    await updateDoc(orgRef, {
      adminId: userRef,
    });

    // 6. Add transaction record
    await addTransaction(firestore, {
      learnerName: `${name} (${companyName})`,
      learnerEmail: email,
      program: `B2B Subscription - ${tier} (${numLearners} Seats, ${period} months)`,
      amount: amount,
      currency: 'KES',
      status: 'Success',
      paystackReference: paymentReference,
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
