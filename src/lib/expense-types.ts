import type { Timestamp } from 'firebase/firestore';

export type ExpenseCategory =
    | 'Facilitator Payment'
    | 'Staff Salary'
    | 'Printing & Stationery'
    | 'Venue & Facilities'
    | 'Marketing & Advertising'
    | 'Software & Subscriptions'
    | 'Travel & Transport'
    | 'Utilities'
    | 'Equipment & Assets'
    | 'Certification & Accreditation'
    | 'Bank & Payment Charges'
    | 'Miscellaneous';

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
    'Facilitator Payment',
    'Staff Salary',
    'Printing & Stationery',
    'Venue & Facilities',
    'Marketing & Advertising',
    'Software & Subscriptions',
    'Travel & Transport',
    'Utilities',
    'Equipment & Assets',
    'Certification & Accreditation',
    'Bank & Payment Charges',
    'Miscellaneous',
];

export type ExpensePaymentMethod = 'Bank Transfer' | 'M-Pesa' | 'Cash' | 'Cheque' | 'Card' | 'Other';

export const PAYMENT_METHODS: ExpensePaymentMethod[] = [
    'Bank Transfer', 'M-Pesa', 'Cash', 'Cheque', 'Card', 'Other'
];

export type Expense = {
    id: string;
    category: ExpenseCategory;
    description: string;
    amount: number;
    currency: string;
    paymentMethod: ExpensePaymentMethod;
    payee: string;          // who was paid (e.g. facilitator name, vendor name)
    referenceNumber?: string; // invoice / receipt / cheque number
    programId?: string;     // optional — tag to a program if program-related
    programName?: string;
    notes?: string;
    createdBy: string;      // admin user email
    date: Timestamp;
    createdAt: Timestamp;
};
