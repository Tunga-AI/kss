'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { usePaystackPayment } from 'react-paystack';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUser, useFirestore, useAuth } from '@/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { addTransaction } from '@/lib/transactions';
import { addUser } from '@/lib/users';
import { createAdmission } from '@/lib/admissions';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Zap, ArrowRight, User as UserIcon, Mail, Lock, CheckCircle } from 'lucide-react';
import type { Program } from '@/lib/program-types';
import { InterestForm } from '@/components/leads/InterestForm';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

const ADMISSION_FEE = 5000;

interface EnrollmentFlowProps {
    program: Program;
}

const parsePrice = (price: string | undefined): number => {
    if (!price || price.toLowerCase() === 'free') return 0;
    const numericString = price.replace(/[^0-9.]/g, '');
    const amount = parseFloat(numericString);
    return isNaN(amount) ? 0 : amount;
};

type EnrollmentStep = 'details' | 'payment' | 'account' | 'success';

export function EnrollmentFlow({ program }: EnrollmentFlowProps) {
    const { user: loggedInUser } = useUser();
    const firestore = useFirestore();
    const auth = useAuth();
    const router = useRouter();
    const { toast } = useToast();

    // State
    const [step, setStep] = useState<EnrollmentStep>('details');
    const [loading, setLoading] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);

    // Guest Data
    const [guestData, setGuestData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: ''
    });

    const isCoreCourse = program.programType === 'Core';
    const programPrice = useMemo(() => parsePrice(program.price), [program.price]);

    // For core courses, we usually charge an admission fee first, then full fee. 
    // The prompt says "pay for the registration fee". Assuming ADMISSION_FEE.
    // If it's not a core course, maybe full price? The prompt mentions "registration fee" in context of account creation.
    // Let's stick to the pattern: Core -> Admission Fee, Others -> Full Price.
    const amountToPay = isCoreCourse ? ADMISSION_FEE : programPrice;

    // Calculate display price
    const displayPrice = amountToPay === 0 ? "Free" : `KES ${amountToPay.toLocaleString()}`;

    // Paystack Config
    const paystackConfig = {
        reference: new Date().getTime().toString(),
        email: loggedInUser?.email || guestData.email,
        amount: amountToPay * 100,
        currency: 'KES',
        publicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY!,
        metadata: {
            custom_fields: [
                { display_name: "Full Name", variable_name: "full_name", value: loggedInUser?.name || guestData.name },
                { display_name: "Program", variable_name: "program", value: program.title },
                { display_name: "Type", variable_name: "type", value: "Enrollment" }
            ]
        }
    };

    const initializePayment = usePaystackPayment(paystackConfig);

    const handleEnrollClick = () => {
        if (loggedInUser) {
            // If logged in, skip the guest flow details
            setStep('payment');
            // Trigger payment immediately if they are logged in? 
            // Or show a confirmation. Let's show confirmation/payment trigger.
            // Actually, if logged in, we might just want to use the existing logic? 
            // But the user asked for a specific flow.
            // Let's keep it simple: Logged in users just confirm & pay.
            initiatePayment();
        } else {
            setStep('details');
            setDialogOpen(true);
        }
    };

    const initiatePayment = () => {
        setLoading(true);
        const onSuccess = async (reference: any) => {
            // 1. Record Transaction
            if (firestore) {
                await addTransaction(firestore, {
                    learnerName: loggedInUser?.name || guestData.name,
                    learnerEmail: loggedInUser?.email || guestData.email,
                    program: program.title,
                    amount: amountToPay,
                    currency: 'KES',
                    status: 'Success',
                    paystackReference: reference.reference,
                });
            }

            if (loggedInUser) {
                // If already logged in, create admission/enrollment and finish
                await completeEnrollmentForUser(loggedInUser.id);
            } else {
                // If guest, move to account creation
                setLoading(false);
                setStep('account');
            }
        };

        const onClose = () => {
            setLoading(false);
            toast({
                variant: 'destructive',
                title: "Payment Cancelled",
                description: "You cancelled the payment process."
            });
        };

        (initializePayment as any)(onSuccess, onClose);
    };

    const completeEnrollmentForUser = async (userId: string) => {
        if (!firestore) return;
        try {
            // Create Admission Record
            await createAdmission(firestore, {
                userId: userId,
                name: loggedInUser?.name || guestData.name,
                email: loggedInUser?.email || guestData.email,
                status: 'Pending Review', // Paid, so pending review
                cohortId: 'PENDING_ASSIGNMENT', // Needs logic to find cohort, simply place holder
                interestedProgramId: program.id,
                interestedProgramTitle: program.title,
            });

            setLoading(false);
            setStep('success'); // Show success view in dialog
            if (!dialogOpen) setDialogOpen(true); // Ensure dialog is open if it wasn't (logged in flow)

        } catch (error) {
            console.error("Enrollment error:", error);
            toast({ variant: 'destructive', title: "Enrollment Error", description: "Payment received but enrollment failed. Contact support." });
            setLoading(false);
        }
    };

    const handleAccountCreation = async (e: React.FormEvent) => {
        e.preventDefault();
        if (guestData.password !== guestData.confirmPassword) {
            toast({ variant: 'destructive', title: "Passwords match error", description: "Passwords do not match." });
            return;
        }
        if (!auth || !firestore) return;

        setLoading(true);
        try {
            // 1. Create Auth User
            const userCredential = await createUserWithEmailAndPassword(auth, guestData.email, guestData.password);

            // 2. Update Profile
            await updateProfile(userCredential.user, { displayName: guestData.name });

            // 3. Create Firestore User Doc
            const firestoreId = await addUser(firestore, {
                name: guestData.name,
                email: guestData.email,
                role: 'Learner',
                status: 'Active',
                // avatar: ... default?
            });

            // 4. Complete Enrollment
            await completeEnrollmentForUser(firestoreId);

        } catch (error: any) {
            console.error("Account creation error:", error);
            let msg = "Could not create account.";
            if (error.code === 'auth/email-already-in-use') msg = "Email already exists. Please log in.";
            toast({ variant: 'destructive', title: "Account Creation Failed", description: msg });
            setLoading(false);
        }
    };

    const handleDetailsSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        initiatePayment();
    }

    return (
        <div className="flex flex-col gap-4 w-full">
            {/* Price Display - Inline */}
            <div className="bg-primary/5 p-4 rounded-xl border border-primary/10 flex items-center justify-between">
                <div>
                    <p className="text-xs uppercase font-bold text-primary/60 tracking-widest">Program Cost</p>
                    <p className="text-2xl font-black text-primary">{displayPrice}</p>
                </div>
                <div className="text-right">
                    {/* Optional: Add "Next Intake" or similar info here if available */}
                </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Button
                    size="lg"
                    className="h-14 font-bold text-base rounded-tl-xl rounded-br-xl shadow-lg bg-accent hover:bg-accent/90"
                    onClick={handleEnrollClick}
                >
                    <Zap className="mr-2 h-5 w-5" /> Enroll Now
                </Button>

                <InterestForm
                    programTitle={program.title}
                    trigger={
                        <Button
                            size="lg"
                            className="h-14 font-bold text-base rounded-tl-xl rounded-br-xl shadow-lg bg-primary hover:bg-primary/90 text-white"
                        >
                            Show Interest
                        </Button>
                    }
                />
            </div>

            {/* Main Enrollment Dialog */}
            <Dialog open={dialogOpen} onOpenChange={(open) => {
                if (!open && step === 'success') {
                    router.push('/l/finance'); // Redirect on close if successful
                } else if (!open && (step === 'payment' || step === 'account')) {
                    // Start over warning? Nah just close.
                }
                setDialogOpen(open);
            }}>
                <DialogContent className="sm:max-w-md rounded-tl-3xl rounded-br-3xl overflow-hidden p-0 gap-0">

                    {/* Header */}
                    <div className="bg-primary text-white p-6">
                        <DialogTitle className="text-2xl font-black flex items-center gap-2">
                            {step === 'success' ? <CheckCircle className="h-6 w-6 text-green-400" /> : <UserIcon className="h-6 w-6 text-accent" />}
                            {step === 'details' && 'Start Registration'}
                            {step === 'payment' && 'Processing Payment'}
                            {step === 'account' && 'Create Your Account'}
                            {step === 'success' && 'Welcome to KSS!'}
                        </DialogTitle>
                        <DialogDescription className="text-white/60 font-medium">
                            {step === 'details' && `Enter your details to proceed with the ${displayPrice} payment.`}
                            {step === 'payment' && 'Please complete the payment in the popup window.'}
                            {step === 'account' && 'Payment successful! Now, set up your secure access.'}
                            {step === 'success' && 'Your registration is complete. Welcome aboard!'}
                        </DialogDescription>
                    </div>

                    <div className="p-6">
                        {step === 'details' && (
                            <form onSubmit={handleDetailsSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Full Name</Label>
                                    <Input
                                        required
                                        value={guestData.name}
                                        onChange={e => setGuestData({ ...guestData, name: e.target.value })}
                                        placeholder="John Doe"
                                        className="h-12 bg-gray-50 font-medium"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Email Address</Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                        <Input
                                            required
                                            type="email"
                                            value={guestData.email}
                                            onChange={e => setGuestData({ ...guestData, email: e.target.value })}
                                            placeholder="john@example.com"
                                            className="pl-10 h-12 bg-gray-50 font-medium"
                                        />
                                    </div>
                                </div>
                                <Button type="submit" className="w-full h-12 font-bold bg-accent hover:bg-accent/90" disabled={loading}>
                                    {loading ? <Loader2 className="animate-spin" /> : 'Proceed to Payment'}
                                </Button>
                            </form>
                        )}

                        {step === 'account' && (
                            <form onSubmit={handleAccountCreation} className="space-y-4">
                                <div className="p-4 bg-green-50 text-green-700 rounded-lg text-sm font-medium mb-4 flex items-center gap-2">
                                    <CheckCircle className="h-4 w-4" /> Payment of {displayPrice} Verified
                                </div>

                                <div className="space-y-2">
                                    <Label>Create Password</Label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                        <Input
                                            required
                                            type="password"
                                            value={guestData.password}
                                            onChange={e => setGuestData({ ...guestData, password: e.target.value })}
                                            className="pl-10 h-12 bg-gray-50"
                                            minLength={6}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Confirm Password</Label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                        <Input
                                            required
                                            type="password"
                                            value={guestData.confirmPassword}
                                            onChange={e => setGuestData({ ...guestData, confirmPassword: e.target.value })}
                                            className="pl-10 h-12 bg-gray-50"
                                        />
                                    </div>
                                </div>
                                <Button type="submit" className="w-full h-12 font-bold bg-primary hover:bg-primary/90" disabled={loading}>
                                    {loading ? <Loader2 className="animate-spin" /> : 'Create Account & access Portal'}
                                </Button>
                            </form>
                        )}

                        {step === 'success' && (
                            <div className="text-center space-y-6">
                                <div className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                                    <CheckCircle className="h-10 w-10 text-green-600" />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-xl font-bold text-primary">You are all set!</h3>
                                    <p className="text-gray-500">Your account has been created and your application submitted. You can now access your learner portal.</p>
                                </div>
                                <Button onClick={() => router.push('/l/finance')} className="w-full h-12 font-bold bg-accent hover:bg-accent/90">
                                    View Transaction <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
