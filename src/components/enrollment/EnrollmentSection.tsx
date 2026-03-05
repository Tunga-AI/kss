'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useUser, useFirestore, useUsersFirestore } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { Loader2, Zap, User as UserIcon, Mail, Smartphone, Send, CheckCircle2, AlertTriangle, LogIn, CalendarDays, CheckCircle } from 'lucide-react';
import type { Program } from '@/lib/program-types';
import { checkUserExists } from '@/lib/user-checks';

import type { Cohort } from '@/lib/cohort-types';
import { cn } from '@/lib/utils';

const ADMISSION_FEE = 5000;

interface EnrollmentSectionProps {
    program: Program;
    selectedCohortId?: string;
    intakes?: Cohort[];
    onCohortSelect?: (cohortId: string) => void;
}

const parsePrice = (price: string | number | undefined): number => {
    if (!price) return 0;
    if (typeof price === 'number') return price;
    if (price.toLowerCase() === 'free') return 0;
    const numericString = price.replace(/[^0-9.]/g, '');
    const amount = parseFloat(numericString);
    return isNaN(amount) ? 0 : amount;
};

type EnrollmentState = 'form' | 'processing_payment';

export function EnrollmentSection({ program, selectedCohortId, intakes = [], onCohortSelect }: EnrollmentSectionProps) {
    const { user: loggedInUser } = useUser();
    const firestore = useFirestore();
    const usersFirestore = useUsersFirestore();
    const router = useRouter();
    const { toast } = useToast();

    // State
    const [status, setStatus] = useState<EnrollmentState>('form');
    const [loading, setLoading] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [existingUserFound, setExistingUserFound] = useState(false);
    const [checkingEmail, setCheckingEmail] = useState(false);

    // Form Data
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
    });

    // Auto-fill form data if user is logged in
    useEffect(() => {
        if (loggedInUser) {
            setFormData(prev => ({
                ...prev,
                name: loggedInUser.name || '',
                email: loggedInUser.email || '',
                phone: loggedInUser.phone || ''
            }));
        }
    }, [loggedInUser]);

    const handleEmailBlur = async () => {
        if (loggedInUser || !formData.email || !usersFirestore) return;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) return;

        setCheckingEmail(true);
        const existing = await checkUserExists(usersFirestore, formData.email);
        setExistingUserFound(!!existing);
        setCheckingEmail(false);
    };

    // Derived State
    // Try to determine program type from name or slug if 'programType' is missing, 
    // or default to 'Short' if not clearly 'Core'.
    // User request: "programType" to be added manually later.
    // We can infer 'Core' if level or intakes are present, or just use price logic.
    // For now, let's look at the price. If price is high (e.g. > 20000), it might be Core/Short.
    // But the logic for price calculation relied on `isCoreCourse`.
    // Let's assume if compentencyLevel/level is present, it might be core.
    // Or check if slug contains 'level'.

    // Simplified logic: The user wants to use the new programs collection.
    // If explicit `programType` exists (legacy), use it.
    // Otherwise, we might need a way to know if we charge Admission Fee or Full Price.
    // The user provided 'Sales Mastery Program - Level 3' with price 104400.
    // Usually Core programs charge Admission Fee (5000) first, then the rest.
    // Short courses charge full price.
    // Let's assume: if price > ADMISSION_FEE * 2, it's likely a big program where we might charge admission fee.
    // BUT the previous code was: `isCoreCourse ? ADMISSION_FEE : programPrice`.
    // Let's stick to that if we can. 
    // Is `programType` available on the new object? The user said "i shall maually add teh program type later".
    // So `program.programType` MIGHT be there.
    // If not, we default to full price? Or Admission Fee?
    // Let's us `program.programType === 'Core'`.

    const isCoreCourse = program.programType === 'Core' || program.programName?.toLowerCase().includes('level'); // Heuristic fallback
    const isElearning = program.programType === 'E-Learning';

    const programPrice = useMemo(() => parsePrice(program.price), [program.price]);

    // Logic: If Core, pay Admission Fee. Else pay Full Price.
    const amountToPay = isCoreCourse ? ADMISSION_FEE : programPrice;

    const displayPrice = amountToPay === 0 ? "Free" : `${program.currency || 'KES'} ${amountToPay.toLocaleString()}`;

    const handleInterestSubmit = async () => {
        if (!formData.name || !formData.email || !formData.phone) {
            toast({ variant: 'destructive', title: "Missing Fields", description: "Please fill in your name, email and phone number." });
            return;
        }
        if (!firestore) return;

        setLoading(true);
        try {
            await addDoc(collection(firestore, 'sales'), {
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
                program: program.programName, // Use programName
                programId: program.id,
                status: 'New',
                source: 'website_enrollment',
                createdAt: serverTimestamp()
            });

            setFormData({ ...formData, name: '', email: '', phone: '' });
            setShowSuccessModal(true);
        } catch (error) {
            console.error("Error submitting lead:", error);
            toast({ variant: "destructive", title: "Submission Failed", description: "Please try again later." });
        } finally {
            setLoading(false);
        }
    };

    const initiatePayment = async () => {
        if ((!loggedInUser && (!formData.name || !formData.email)) || !formData.phone) {
            toast({ variant: 'destructive', title: "Missing Fields", description: "Please complete the form first." });
            return;
        }

        // Block if email belongs to an existing account
        if (!loggedInUser && existingUserFound) {
            toast({ variant: 'destructive', title: "Account Already Exists", description: "Please log in to proceed with your registration." });
            return;
        }

        setLoading(true);
        setStatus('processing_payment');

        try {
            console.log('🚀 Initializing payment with backend...');

            // Call backend API to initialize payment
            const response = await fetch('/api/paystack/initialize', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: loggedInUser?.email || formData.email,
                    amount: amountToPay,
                    reference: `KSS_${Date.now()}`,
                    metadata: {
                        learnerName: loggedInUser?.name || formData.name,
                        learnerEmail: loggedInUser?.email || formData.email,
                        phone: formData.phone,
                        program: program.programName,
                        programId: program.id,
                        cohortId: selectedCohortId || undefined,
                        userId: loggedInUser?.id || null,
                        isElearning: isElearning,
                        programSlug: program.slug,
                        // Redirect logic
                        redirectUrl: loggedInUser
                            ? (isElearning ? `/e-learning/${program.slug}/learn` : (isCoreCourse ? '/l' : '/l/courses/' + program.slug))
                            : `/login?flow=setup_account&email=${encodeURIComponent(formData.email)}&name=${encodeURIComponent(formData.name)}&phone=${encodeURIComponent(formData.phone)}&programId=${program.id}&programTitle=${encodeURIComponent(program.programName)}${isElearning ? `&isElearning=true&redirect=${encodeURIComponent(`/e-learning/${program.slug}/learn`)}` : ''}`
                    }
                }),
            });

            const result = await response.json();

            if (!result.success) {
                throw new Error(result.message || 'Failed to initialize payment');
            }

            console.log('✅ Payment initialized:', result.data);

            // Redirect to Paystack hosted page
            window.location.href = result.data.authorization_url;

        } catch (error: any) {
            console.error('❌ Payment initialization error:', error);
            toast({
                variant: 'destructive',
                title: 'Payment Error',
                description: error.message || 'Failed to initialize payment. Please try again.'
            });
            setLoading(false);
            setStatus('form');
        }
    };

    return (
        <Card className="bg-white border-primary/10 shadow-xl overflow-hidden">
            <CardHeader className="bg-primary text-white p-6">
                <CardTitle className="font-headline text-2xl">Join the Program</CardTitle>
                <CardDescription className="text-white/70 font-medium">
                    Begin your application for {program.programName}.
                </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">

                {/* Cohort / Intake Picker */}
                {intakes.length > 0 && (
                    <div className="space-y-3">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-primary/40 ml-1">Select Intake</h3>
                        <div className="space-y-2">
                            {intakes.map((intake) => (
                                <div
                                    key={intake.id}
                                    onClick={() => onCohortSelect?.(intake.id === selectedCohortId ? '' : intake.id)}
                                    className={cn(
                                        "cursor-pointer border rounded-xl p-3 transition-all hover:border-primary",
                                        selectedCohortId === intake.id
                                            ? "bg-accent/5 border-accent ring-1 ring-accent"
                                            : "border-gray-200"
                                    )}
                                >
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="font-bold text-sm text-primary">{intake.name}</span>
                                        {selectedCohortId === intake.id && <CheckCircle className="h-4 w-4 text-accent" />}
                                    </div>
                                    {(intake.startDate || intake.endDate) && (
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <CalendarDays className="h-3 w-3" />
                                            <span>
                                                {intake.startDate ? new Date(
                                                    typeof (intake.startDate as any).toDate === 'function'
                                                        ? (intake.startDate as any).toDate()
                                                        : intake.startDate
                                                ).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }) : 'Flexible Start'}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                        <div className="border-t border-gray-100" />
                    </div>
                )}

                {intakes.length === 0 && onCohortSelect !== undefined && (
                    <div className="text-sm text-gray-500 italic bg-gray-50 p-4 rounded-lg text-center border border-gray-100">
                        No active intakes currently available.
                    </div>
                )}
                <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-widest text-primary/40 ml-1">Full Name</Label>
                    <div className="relative">
                        <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/30" />
                        <Input
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            className="pl-10 h-12 bg-gray-50 font-bold text-primary"
                            placeholder="Full Name"
                            disabled={loading || !!loggedInUser}
                        />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-widest text-primary/40 ml-1">Email Address</Label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/30" />
                        <Input
                            value={formData.email}
                            onChange={e => {
                                setFormData({ ...formData, email: e.target.value });
                                setExistingUserFound(false);
                            }}
                            onBlur={handleEmailBlur}
                            className={`pl-10 h-12 bg-gray-50 font-bold text-primary ${existingUserFound ? 'border-orange-500 focus-visible:ring-orange-500' : ''}`}
                            placeholder="Email Address"
                            type="email"
                            disabled={loading || !!loggedInUser}
                        />
                        {checkingEmail && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-primary/40" />}
                    </div>
                    {existingUserFound && (
                        <div className="flex items-start gap-2 bg-orange-50 border border-orange-200 rounded-lg p-3">
                            <AlertTriangle className="h-4 w-4 text-orange-500 flex-shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-orange-700">Account already exists</p>
                                <p className="text-xs text-orange-600 mt-0.5">An account with this email is already registered. Please log in to continue.</p>
                            </div>
                            <Button
                                size="sm"
                                variant="outline"
                                className="flex-shrink-0 border-orange-400 text-orange-700 hover:bg-orange-100 text-xs h-8"
                                onClick={() => router.push(`/login?email=${encodeURIComponent(formData.email)}&redirect=/courses/${program.slug}`)}
                            >
                                <LogIn className="h-3 w-3 mr-1" />
                                Log In
                            </Button>
                        </div>
                    )}
                </div>
                <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-widest text-primary/40 ml-1">Phone Number</Label>
                    <div className="relative">
                        <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/30" />
                        <Input
                            value={formData.phone}
                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                            className="pl-10 h-12 bg-gray-50 font-bold text-primary"
                            placeholder="Mobile Number"
                            type="tel"
                            disabled={loading}
                        />
                    </div>
                </div>

                {!loggedInUser && (
                    <p className="text-xs text-primary/50 italic px-1">
                        * You will create your account password after payment verification.
                    </p>
                )}
            </CardContent>

            <CardFooter className="flex flex-col gap-3 p-6 pt-0">
                <Button
                    className="w-full h-14 font-black text-white bg-accent hover:bg-accent/90 shadow-lg text-sm md:text-base rounded-tl-xl rounded-br-xl"
                    onClick={initiatePayment}
                    disabled={loading || (!loggedInUser && existingUserFound)}
                >
                    {loading && status === 'processing_payment' ? <Loader2 className="animate-spin mr-2" /> : <Zap className="mr-2 h-5 w-5" />}
                    Pay {isCoreCourse ? 'Registration' : 'Fee'} ({displayPrice})
                </Button>

                <div className="relative w-full py-2">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-primary/10" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-white px-2 text-primary/40 font-bold">Or</span>
                    </div>
                </div>

                <Button
                    variant="default"
                    className="w-full h-12 font-bold bg-primary hover:bg-primary/90 text-white shadow-md text-sm md:text-base rounded-tl-xl rounded-br-xl"
                    onClick={handleInterestSubmit}
                    disabled={loading}
                >
                    {loading && status !== 'processing_payment' ? <Loader2 className="animate-spin mr-2" /> : <Send className="mr-2 h-4 w-4" />}
                    Just Show Interest
                </Button>
            </CardFooter>

            {/* Interest Success Modal */}
            <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
                <DialogContent className="sm:max-w-md bg-white border-0 shadow-2xl rounded-tl-3xl rounded-br-3xl rounded-tr-sm rounded-bl-sm">
                    <DialogHeader className="flex flex-col items-center text-center space-y-4 pt-6">
                        <div className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center">
                            <CheckCircle2 className="h-10 w-10 text-green-600" />
                        </div>
                        <DialogTitle className="text-2xl font-bold text-primary font-headline">Interest Registered!</DialogTitle>
                        <DialogDescription className="text-center text-base font-medium text-gray-600">
                            Thank you for your interest in {program.programName}. We have received your details and our team will be in touch shortly.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="flex flex-col sm:flex-row gap-3 pt-6 pb-2 w-full">
                        <div className="flex flex-col w-full gap-3">
                            <Button
                                className="w-full h-12 font-bold bg-primary hover:bg-primary/90 text-white rounded-tl-xl rounded-br-xl rounded-tr-sm rounded-bl-sm"
                                onClick={() => router.push('/courses#programs')}
                            >
                                Explore More Programs
                            </Button>
                            <Button variant="outline" className="w-full h-12 font-bold text-primary/70 hover:text-primary rounded-tl-xl rounded-br-xl rounded-tr-sm rounded-bl-sm" onClick={() => router.push('/')}>
                                Go Back Home
                            </Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Card>
    );
}
