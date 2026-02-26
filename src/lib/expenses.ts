import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    serverTimestamp,
    type Firestore,
} from 'firebase/firestore';
import type { Expense, ExpenseCategory, ExpensePaymentMethod } from './expense-types';

export type CreateExpenseInput = {
    category: ExpenseCategory;
    description: string;
    amount: number;
    currency?: string;
    paymentMethod: ExpensePaymentMethod;
    payee: string;
    referenceNumber?: string;
    programId?: string;
    programName?: string;
    notes?: string;
    createdBy: string;
    date: Date;
};

export async function addExpense(
    firestore: Firestore,
    input: CreateExpenseInput
): Promise<string> {
    const ref = await addDoc(collection(firestore, 'expenses'), {
        ...input,
        currency: input.currency || 'KES',
        date: input.date,
        createdAt: serverTimestamp(),
    });
    return ref.id;
}

export async function updateExpense(
    firestore: Firestore,
    expenseId: string,
    updates: Partial<Omit<Expense, 'id' | 'createdAt'>>
): Promise<void> {
    await updateDoc(doc(firestore, 'expenses', expenseId), updates as any);
}

export async function deleteExpense(
    firestore: Firestore,
    expenseId: string
): Promise<void> {
    await deleteDoc(doc(firestore, 'expenses', expenseId));
}
