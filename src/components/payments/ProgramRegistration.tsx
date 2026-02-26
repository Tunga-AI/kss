'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { usePaystackPayment } from 'react-paystack';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUser, useFirestore, useCollection } from '@/firebase';
import type { Program } from '@/lib/program-types';
import type { Admission } from '@/lib/admission-types';
import type { Cohort } from '@/lib/cohort-types';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Zap, ShieldCheck, Mail, ArrowRight, User as UserIcon, Ticket, Minus, Plus, Phone } from 'lucide-react';
import { AuthDialog } from '@/components/auth/AuthDialog';
import { createAdmission } from '@/lib/admissions';
import { checkUserExists } from '@/lib/user-checks';
import { collection, query, where, limit } from 'firebase/firestore';
import Link from 'next/link';

const ADMISSION_FEE = 5000;

interface ProgramRegistrationProps {
    program: Program;
    customRedirectUrl?: string;
    selectedCohortId?: string;
}

const parsePrice = (price: string | number | undefined): number => {
    if (price === undefined || price === null || price === '') return 0;
    if (typeof price === 'number') return isNaN(price) ? 0 : price;
    if (price.toLowerCase() === 'free') return 0;
    const numericString = price.replace(/[^0-9.]/g, '');
    const amount = parseFloat(numericString);
    return isNaN(amount) ? 0 : amount;
};

export function ProgramRegistration({ program, customRedirectUrl, selectedCohortId }: ProgramRegistrationProps) {
    const { user: loggedInUser, loading: userLoading } = useUser();
    const firestore = useFirestore();
    const router = useRouter();
    const { toast } = useToast();

    // Component State
    const [authDialogOpen, setAuthDialogOpen] = useState(false);
    const [guestDialogOpen, setGuestDialogOpen] = useState(false);
    const [eventTicketDialogOpen, setEventTicketDialogOpen] = useState(false);
    const [guestName, setGuestName] = useState('');
    const [guestEmail, setGuestEmail] = useState('');
    const [guestPhone, setGuestPhone] = useState('');
    const [ticketCount, setTicketCount] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [existingUserDetected, setExistingUserDetected] = useState(false);
    const [isCheckingEmail, setIsCheckingEmail] = useState(false);

    // Derived State
    const isCoreCourse = program.programType === 'Core';
    const isEvent = program.programType === 'Event';
    const isELearning = program.programType === 'E-Learning';
    const isShort = program.programType === 'Short';
    const programPrice = useMemo(() => parsePrice(program.price), [program.price]);
    const registrationFee = useMemo(() => parsePrice((program as any).registrationFee || program.admissionCost), [(program as any).registrationFee, program.admissionCost]);

    // Calculate final price based on type
    const finalPrice = useMemo(() => {
        if (registrationFee) return registrationFee;
        if (isCoreCourse) return ADMISSION_FEE;
        if (isEvent) return programPrice * ticketCount;
        return programPrice;
    }, [registrationFee, isCoreCourse, isEvent, programPrice, ticketCount]);

    const userEmail = loggedInUser?.email || guestEmail;
    const userName = loggedInUser?.name || guestName;
    const userPhone = loggedInUser?.phone || guestPhone;

    // Paystack inline config — amount in kobo (×100)
    const paystackConfig = useMemo(() => ({
        publicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY!,
        email: userEmail || 'unknown@kss.co.ke',
        amount: Math.round(finalPrice * 100),
        currency: 'KES' as const,
        reference: `KSS_${Date.now()}`,
        metadata: {
            custom_fields: [
                { display_name: 'Full Name', variable_name: 'full_name', value: userName },
                { display_name: 'Phone', variable_name: 'phone', value: userPhone },
                { display_name: 'Program', variable_name: 'program', value: (isCoreCourse ? `Admission Fee - ${program.programName || program.title}` : (program.programName || program.title)) },
                { display_name: 'Program ID', variable_name: 'program_id', value: program.id },
            ],
            learnerName: userName,
            learnerEmail: userEmail,
            learnerPhone: userPhone,
            programId: program.id,
            isCoreCourse,
        },
    }), [userEmail, userName, userPhone, finalPrice, isCoreCourse, program]);

    const initializePaystackPayment = usePaystackPayment(paystackConfig);

    // For Core programs: query cohorts scoped to THIS program only
    const activeCohortQuery = useMemo(() => {
        if (!firestore || !isCoreCourse) return null;
        return query(
            collection(firestore, 'cohorts'),
            where('programIds', 'array-contains', program.id),
            where('status', '==', 'Accepting Applications'),
            limit(1)
        );
    }, [firestore, isCoreCourse, program.id]);

    const existingAdmissionQuery = useMemo(() => (firestore && loggedInUser) ? query(collection(firestore, 'admissions'), where('userId', '==', loggedInUser.id), limit(1)) : null, [firestore, loggedInUser]);
    const { data: activeCohorts, loading: cohortsLoading } = useCollection<Cohort>(activeCohortQuery as any);
    const { data: existingAdmissions, loading: admissionsLoading } = useCollection<Admission>(existingAdmissionQuery as any);

    // Use learner-selected cohort if provided, otherwise fall back to first active cohort for this program
    const activeCohort = useMemo(() => {
        if (selectedCohortId && activeCohorts) {
            return activeCohorts.find(c => c.id === selectedCohortId) || activeCohorts[0];
        }
        return activeCohorts?.[0];
    }, [activeCohorts, selectedCohortId]);

    const existingAdmission = useMemo(() => existingAdmissions?.[0], [existingAdmissions]);

    const loading = userLoading || (isCoreCourse && (cohortsLoading || admissionsLoading));

    // Determine redirect URL for post-payment
    const getRedirectUrl = () => {
        if (customRedirectUrl) return customRedirectUrl;
        if (isCoreCourse) return '/l';
        if (isELearning) return `/l/e-learning/${program.slug}`;
        if (isShort) return `/l/courses/${program.slug}`;
        if (!loggedInUser) return '/?registration=success';
        return '/l/finance';
    };

    // Validate email format
    const validateEmail = (email: string): boolean => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    // Validate and format phone number with Kenya country code
    const validateAndFormatPhone = (phone: string): string | null => {
        if (!phone) return null;

        // Remove all non-numeric characters
        const cleaned = phone.replace(/\D/g, '');

        // Handle different formats:
        // 254... (already has country code)
        // 0... (local format)
        // 7... or 1... (without leading 0)
        if (cleaned.startsWith('254')) {
            return `+${cleaned}`;
        } else if (cleaned.startsWith('0')) {
            return `+254${cleaned.substring(1)}`;
        } else if (cleaned.length === 9) {
            // Assume it's a local number without leading 0
            return `+254${cleaned}`;
        }

        return null; // Invalid format
    };

    // Open Paystack inline popup
    const initiatePayment = useCallback(() => {
        // Validate name
        if (!userName || userName.trim().length < 2) {
            toast({ variant: 'destructive', title: "Invalid Name", description: "Please provide your full name to continue." });
            return;
        }
        // Validate email
        if (!userEmail || !validateEmail(userEmail)) {
            toast({ variant: 'destructive', title: "Invalid Email", description: "Please provide a valid email address." });
            return;
        }
        // Validate phone
        const formattedPhone = validateAndFormatPhone(userPhone);
        if (!formattedPhone) {
            toast({ variant: 'destructive', title: "Invalid Phone Number", description: "Please provide a valid Kenyan phone number (e.g. 0712345678)." });
            return;
        }

        setIsSubmitting(true);

        const redirectUrl = getRedirectUrl();

        initializePaystackPayment({
            onSuccess: async (response: any) => {
                setIsSubmitting(false);
                // Close any open dialogs
                setGuestDialogOpen(false);
                setEventTicketDialogOpen(false);
                toast({ title: "Payment Successful", description: "Your payment was received. Processing your registration..." });
                // Verify server-side in background then redirect
                try {
                    await fetch('/api/paystack/verify', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            reference: response.reference,
                            metadata: {
                                learnerName: userName.trim(),
                                learnerEmail: userEmail.trim().toLowerCase(),
                                learnerPhone: formattedPhone,
                                programId: program.id,
                                ticketCount: isEvent ? ticketCount : undefined,
                                redirectUrl,
                                userId: loggedInUser?.id,
                                cohortId: selectedCohortId || activeCohort?.id,
                                isCoreCourse,
                                admissionId: existingAdmission?.id,
                            }
                        }),
                    });
                } catch (e) {
                    console.error('Verify error:', e);
                }
                router.push(redirectUrl);
            },
            onClose: () => {
                setIsSubmitting(false);
                toast({ title: "Payment Cancelled", description: "You closed the payment window. You can try again anytime." });
            },
        });
    }, [userName, userEmail, userPhone, initializePaystackPayment, toast, getRedirectUrl, isEvent, ticketCount, loggedInUser, selectedCohortId, activeCohort, isCoreCourse, existingAdmission, program.id, router]);

    // Check if email already exists in the system
    const handleEmailCheck = async (email: string) => {
        setGuestEmail(email);

        if (!email || !firestore || !email.includes('@')) {
            setExistingUserDetected(false);
            return;
        }

        setIsCheckingEmail(true);
        try {
            const existingUser = await checkUserExists(firestore, email);
            setExistingUserDetected(!!existingUser);
        } catch (error) {
            console.error('Error checking email:', error);
            setExistingUserDetected(false);
        } finally {
            setIsCheckingEmail(false);
        }
    };

    const handleCoreCourseApplication = async () => {
        if (!loggedInUser) {
            setAuthDialogOpen(true);
            return;
        }
        if (!activeCohort) {
            toast({ variant: 'destructive', title: 'Applications Closed', description: 'We are not currently accepting new applications.' });
            return;
        }

        try {
            const admissionData = {
                userId: loggedInUser.id,
                name: loggedInUser.name,
                email: loggedInUser.email,
                status: 'Pending Payment' as const,
                cohortId: selectedCohortId || activeCohort.id,
                interestedProgramId: program.id,
                interestedProgramTitle: program.title,
                assessmentRequired: true,
                assessmentCompleted: false,
            };
            if (firestore) {
                await createAdmission(firestore, admissionData);
                await initiatePayment();
            }
        } catch (error) {
            console.error("Error creating admission record:", error);
            toast({ variant: 'destructive', title: 'Application Error', description: 'Could not start your application. Please try again.' });
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <Button className="w-full bg-primary/10 border-none h-14 rounded-tl-xl rounded-br-xl text-primary font-bold cursor-wait" disabled>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Finalizing Assets...
            </Button>
        );
    }

    if (isCoreCourse) {
        if (!activeCohort) return <Button size="lg" className="w-full bg-gray-100 text-gray-400 font-black text-[10px] uppercase tracking-widest h-14 rounded-tl-xl rounded-br-xl" disabled>Applications Currently Closed</Button>;

        if (existingAdmission) {
            const status = existingAdmission.status;
            if (status === 'Pending Payment') return (
                <Button className="w-full bg-accent hover:bg-accent/90 text-white font-black text-[10px] uppercase tracking-widest h-14 rounded-tl-xl rounded-br-xl shadow-lg transition-all" onClick={initiatePayment} disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Pay Admission Fee (KES {registrationFee || ADMISSION_FEE})
                </Button>
            );
            if (status === 'Pending Review' || status === 'Pending Assessment') return (
                <Button className="w-full bg-primary/10 text-primary/60 font-black text-[10px] uppercase tracking-widest h-14 rounded-tl-xl rounded-br-xl border-none" disabled>
                    Application Under Review
                </Button>
            );
            if (status === 'Admitted' || status === 'Rejected' || status === 'Placed') return (
                <Button className="w-full bg-primary hover:bg-primary/90 text-white font-black text-[10px] uppercase tracking-widest h-14 rounded-tl-xl rounded-br-xl shadow-lg transition-all" asChild>
                    <Link href="/l/admissions">
                        View Application Status <ArrowRight className="h-4 w-4 ml-2" />
                    </Link>
                </Button>
            );
        }

        return (
            <>
                <AuthDialog
                    open={authDialogOpen}
                    onOpenChange={setAuthDialogOpen}
                    program={program}
                    onSuccess={() => handleCoreCourseApplication()}
                />
                <Button className="w-full bg-accent hover:bg-accent/90 text-white font-black text-[10px] uppercase tracking-widest h-14 rounded-tl-xl rounded-br-xl shadow-lg transition-all active:scale-95" onClick={handleCoreCourseApplication} disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4 mr-2" />}
                    Apply for Admission (KES {registrationFee || ADMISSION_FEE})
                </Button>
            </>
        );
    }

    // Default flow for Events, E-Learning, Short courses
    const handleGenericRegistration = () => {
        if (!loggedInUser && !isEvent) {
            setAuthDialogOpen(true);
        } else if (isEvent && loggedInUser) {
            setEventTicketDialogOpen(true);
        } else if (isEvent && !loggedInUser) {
            setGuestDialogOpen(true);
        } else {
            initiatePayment();
        }
    }

    const handlePaymentTrigger = async (e: React.FormEvent) => {
        e.preventDefault();
        if ((!loggedInUser && (!guestName || !guestEmail)) || (isEvent && ticketCount < 1)) return;
        await initiatePayment();
    }

    return (
        <>
            <AuthDialog
                open={authDialogOpen}
                onOpenChange={setAuthDialogOpen}
                program={program}
                onSuccess={() => {
                    const portalUrl = isELearning ? `/l/e-learning/${program.slug}` : `/l/courses/${program.slug}`;
                    router.push(portalUrl);
                }}
            />

            {/* Guest / Event Dialog */}
            <Dialog open={guestDialogOpen} onOpenChange={setGuestDialogOpen}>
                <DialogContent className="max-w-md bg-white rounded-tl-3xl rounded-br-3xl border-none shadow-2xl p-0 overflow-hidden">
                    <div className="bg-primary text-white p-8">
                        <DialogTitle className="text-2xl font-black tracking-tight flex items-center gap-3">
                            <UserIcon className="h-6 w-6 text-accent" />
                            {isEvent ? 'Event Registration' : 'Guest Pass Registry'}
                        </DialogTitle>
                        <DialogDescription className="text-white/40 text-[10px] uppercase font-bold tracking-widest mt-2 px-1">
                            Secure your access for {program.title}
                        </DialogDescription>
                    </div>
                    <form onSubmit={handlePaymentTrigger} className="p-8 space-y-6">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-primary/40 ml-1">Legal Designation</Label>
                                <Input
                                    placeholder="Enter your full name"
                                    className="h-14 bg-primary/5 border-primary/10 rounded-tl-xl rounded-br-xl font-bold"
                                    value={guestName}
                                    onChange={(e) => setGuestName(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-primary/40 ml-1">Electronic Mail</Label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/30" />
                                    <Input
                                        type="email"
                                        placeholder="mutunga@example.com"
                                        className="pl-12 h-14 bg-primary/5 border-primary/10 rounded-tl-xl rounded-br-xl font-bold"
                                        value={guestEmail}
                                        onChange={(e) => handleEmailCheck(e.target.value)}
                                        onBlur={(e) => handleEmailCheck(e.target.value)}
                                        required
                                    />
                                    {isCheckingEmail && (
                                        <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-primary/30" />
                                    )}
                                </div>
                                {existingUserDetected && (
                                    <div className="bg-accent/10 border border-accent/20 rounded-lg p-4 space-y-3 mt-2">
                                        <p className="text-sm font-bold text-accent flex items-center gap-2">
                                            <ShieldCheck className="h-4 w-4" />
                                            Account Already Exists
                                        </p>
                                        <p className="text-xs text-primary/60">
                                            This email is already registered. Please log in to continue with your existing account and avoid duplicate payments.
                                        </p>
                                        <Button
                                            type="button"
                                            onClick={() => {
                                                setGuestDialogOpen(false);
                                                setEventTicketDialogOpen(false);
                                                setAuthDialogOpen(true);
                                            }}
                                            className="w-full bg-accent hover:bg-accent/90 text-white font-bold text-xs h-10 rounded-lg"
                                        >
                                            Log In Instead
                                        </Button>
                                    </div>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-primary/40 ml-1">Phone Number</Label>
                                <div className="relative">
                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/30" />
                                    <Input
                                        type="tel"
                                        placeholder="+254712345678 or 0712345678"
                                        className="pl-12 h-14 bg-primary/5 border-primary/10 rounded-tl-xl rounded-br-xl font-bold"
                                        value={guestPhone}
                                        onChange={(e) => setGuestPhone(e.target.value)}
                                        required
                                    />
                                </div>
                                <p className="text-[10px] text-primary/40 ml-1">Required for payment verification and communication</p>
                            </div>

                            {isEvent && (
                                <div className="space-y-2 pt-2 border-t border-primary/5">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-primary/40 ml-1">Number of Tickets</Label>
                                    <div className="flex items-center gap-4">
                                        <Button type="button" variant="outline" size="icon" onClick={() => setTicketCount(Math.max(1, ticketCount - 1))}>
                                            <Minus className="h-4 w-4" />
                                        </Button>
                                        <span className="text-xl font-bold text-primary w-8 text-center">{ticketCount}</span>
                                        <Button type="button" variant="outline" size="icon" onClick={() => setTicketCount(ticketCount + 1)}>
                                            <Plus className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <p className="text-xs text-primary/60 text-right mt-1">Total: <strong>KES {finalPrice.toLocaleString()}</strong></p>
                                </div>
                            )}
                        </div>
                        <Button type="submit" disabled={isSubmitting || existingUserDetected} className="w-full bg-accent hover:bg-accent/90 text-white font-black text-[10px] uppercase tracking-widest h-14 rounded-tl-xl rounded-br-xl shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4 mr-2" />}
                            Proceed to Checkout (KES {finalPrice.toLocaleString()})
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Logged In Event Ticket Dialog */}
            <Dialog open={eventTicketDialogOpen} onOpenChange={setEventTicketDialogOpen}>
                <DialogContent className="max-w-md bg-white rounded-tl-3xl rounded-br-3xl border-none shadow-2xl p-0 overflow-hidden">
                    <div className="bg-primary text-white p-8">
                        <DialogTitle className="text-2xl font-black tracking-tight flex items-center gap-3">
                            <Ticket className="h-6 w-6 text-accent" />
                            Ticket Selection
                        </DialogTitle>
                        <DialogDescription className="text-white/40 text-[10px] uppercase font-bold tracking-widest mt-2 px-1">
                            How many people are you registering?
                        </DialogDescription>
                    </div>
                    <form onSubmit={handlePaymentTrigger} className="p-8 space-y-6">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-primary/40 ml-1">Number of Tickets</Label>
                                <div className="flex items-center gap-4">
                                    <Button type="button" variant="outline" size="icon" onClick={() => setTicketCount(Math.max(1, ticketCount - 1))}>
                                        <Minus className="h-4 w-4" />
                                    </Button>
                                    <span className="text-xl font-bold text-primary w-8 text-center">{ticketCount}</span>
                                    <Button type="button" variant="outline" size="icon" onClick={() => setTicketCount(ticketCount + 1)}>
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            <div className="bg-primary/5 p-4 rounded-lg flex justify-between items-center">
                                <span className="text-sm font-bold text-primary/60">Price per ticket</span>
                                <span className="text-sm font-bold text-primary">KES {programPrice.toLocaleString()}</span>
                            </div>

                            <div className="flex justify-between items-center pt-2 border-t border-primary/10">
                                <span className="text-lg font-black text-primary">Total</span>
                                <span className="text-2xl font-black text-accent">KES {finalPrice.toLocaleString()}</span>
                            </div>
                        </div>
                        <Button type="submit" disabled={isSubmitting} className="w-full bg-accent hover:bg-accent/90 text-white font-black text-[10px] uppercase tracking-widest h-14 rounded-tl-xl rounded-br-xl shadow-lg transition-all">
                            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4 mr-2" />}
                            Proceed to Payment (KES {finalPrice.toLocaleString()})
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>

            <Button size="lg" className="w-full bg-accent hover:bg-accent/90 text-white font-black text-[10px] uppercase tracking-widest h-14 rounded-tl-xl rounded-br-xl shadow-lg transition-all active:scale-95" onClick={handleGenericRegistration} disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {programPrice === 0 ? "Enroll for Free" : `Register Now (KES ${programPrice})`}
                <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
        </>
    )
}
