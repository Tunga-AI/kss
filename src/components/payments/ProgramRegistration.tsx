'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { usePaystackPayment } from 'react-paystack';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUser, useFirestore } from '@/firebase';
import type { Program } from '@/lib/program-types';
import { addTransaction } from '@/lib/transactions';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { AuthDialog } from '@/components/auth/AuthDialog';
import { addLearner } from '@/lib/learners';
import { convertLeadToAdmitted } from '@/lib/sales';

interface ProgramRegistrationProps {
    program: Program;
}

const parsePrice = (price: string | undefined): number => {
    if (!price || price.toLowerCase() === 'free') {
        return 0;
    }
    const numericString = price.replace(/[^0-9.]/g, '');
    const amount = parseFloat(numericString);
    return isNaN(amount) ? 0 : amount;
};

export function ProgramRegistration({ program }: ProgramRegistrationProps) {
    const { user: loggedInUser, loading: userLoading } = useUser();
    const firestore = useFirestore();
    const router = useRouter();
    const { toast } = useToast();

    const [authDialogOpen, setAuthDialogOpen] = useState(false);
    const [guestDialogOpen, setGuestDialogOpen] = useState(false);
    const [guestName, setGuestName] = useState('');
    const [guestEmail, setGuestEmail] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const isCourse = ['Core', 'E-Learning', 'Short'].includes(program.programType);
    const programPrice = useMemo(() => parsePrice(program.price), [program.price]);
    
    const userEmail = loggedInUser?.email || guestEmail;
    const userName = loggedInUser?.name || guestName;

    const paystackConfig = {
        reference: new Date().getTime().toString(),
        email: userEmail,
        amount: programPrice * 100, // Amount in kobo
        currency: 'KES',
        publicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY!,
        metadata: {
            custom_fields: [
                { display_name: "Full Name", variable_name: "full_name", value: userName },
                { display_name: "Program", variable_name: "program", value: program.title }
            ]
        }
    };

    const initializePayment = usePaystackPayment(paystackConfig);

    const onPaymentSuccess = (reference: any) => {
        if (!firestore || !userName || !userEmail) return;
        
        addTransaction(firestore, {
            learnerName: userName,
            learnerEmail: userEmail,
            program: program.title,
            amount: programPrice,
            currency: 'KES',
            status: 'Success',
            paystackReference: reference.reference,
        });

        // If a user is logged in (which they will be for courses), create a learner and update lead status
        if (loggedInUser) {
            addLearner(firestore, {
                name: userName,
                email: userEmail,
                program: program.title,
            });
            convertLeadToAdmitted(firestore, userEmail, program.title);
        }

        toast({
            title: "Registration Successful!",
            description: "Thank you for registering. You'll receive a confirmation email shortly.",
        });
        setIsSubmitting(false);
        setGuestDialogOpen(false); // Also close guest dialog if open
    };

    const onPaymentClose = () => {
        setIsSubmitting(false);
        toast({
            variant: "destructive",
            title: "Payment window closed",
            description: "Your registration was not completed.",
        });
    };

    const handleCourseRegistration = () => {
        if (!loggedInUser) {
            // User must create an account for courses
            setAuthDialogOpen(true);
        } else {
            // User is logged in, but not yet enrolled.
            // Initiate payment flow.
            setIsSubmitting(true);
            if (programPrice === 0) {
                 handleFreeEnrollment(userName, userEmail);
            } else {
                initializePayment(onPaymentSuccess, onPaymentClose);
            }
        }
    };

    const handleEventRegistration = () => {
        if (loggedInUser) {
            // If logged in, proceed directly to payment/enrollment for event
            setIsSubmitting(true);
            if (programPrice === 0) {
                handleFreeEnrollment(userName, userEmail);
            } else {
                initializePayment(onPaymentSuccess, onPaymentClose);
            }
        } else {
            // If guest, open the dialog to collect info
            setGuestDialogOpen(true);
        }
    };
    
    const handleGuestSubmitForEvent = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        // We know this is for a guest, so use guestName and guestEmail
        if (programPrice === 0) {
            handleFreeEnrollment(guestName, guestEmail);
        } else {
            initializePayment(onPaymentSuccess, onPaymentClose);
        }
    };


    const handleFreeEnrollment = (name: string, email: string) => {
        if (!firestore) {
            setIsSubmitting(false);
            return;
        };

        addTransaction(firestore, {
            learnerName: name,
            learnerEmail: email,
            program: program.title,
            amount: 0,
            currency: 'KES',
            status: 'Success',
            paystackReference: `free_enroll_${new Date().getTime()}`,
        });
        
        if (loggedInUser || isCourse) { // Create learner record if it's a course or if user is logged in for an event
            addLearner(firestore, { name, email, program: program.title });
            if (loggedInUser) { // Only convert leads for logged-in users
                convertLeadToAdmitted(firestore, email, program.title);
            }
        }

        toast({
            title: "Enrollment Successful!",
            description: `You are now enrolled in ${program.title}.`,
        });
        setIsSubmitting(false);
        setGuestDialogOpen(false);
    };


    if (userLoading) {
        return <Button size="lg" disabled>Loading...</Button>;
    }
    
    // COURSE REGISTRATION FLOW
    if (isCourse) {
        return (
            <>
                <AuthDialog 
                    open={authDialogOpen}
                    onOpenChange={setAuthDialogOpen}
                    program={program}
                    onSuccess={() => {
                        // On successful login/registration, redirect to the course page in the portal
                        const portalUrl = `/l/${program.programType === 'E-Learning' ? 'e-learning' : 'courses'}/${program.slug}`;
                        router.push(portalUrl);
                    }}
                />
                <Button size="lg" onClick={handleCourseRegistration}>
                    {loggedInUser ? (programPrice === 0 ? 'Enroll for Free' : `Enroll Now (${program.price})`) : 'Register to Enroll'}
                </Button>
            </>
        );
    }
    
    // EVENT REGISTRATION FLOW
    const eventButtonText = programPrice === 0 ? 'Register for Free' : `Register Now (${program.price})`;

    return (
        <>
            <Dialog open={guestDialogOpen} onOpenChange={setGuestDialogOpen}>
                <DialogTrigger asChild>
                    {/* This button is only visible for guests. Logged-in users have a direct button below. */}
                    {!loggedInUser ? <Button size="lg">{eventButtonText}</Button> : null}
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Register for {program.title}</DialogTitle>
                        <DialogDescription>
                            Please provide your details to register for this event.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleGuestSubmitForEvent} className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Full Name</Label>
                            <Input id="name" value={guestName} onChange={(e) => setGuestName(e.target.value)} required />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email Address</Label>
                            <Input id="email" type="email" value={guestEmail} onChange={(e) => setGuestEmail(e.target.value)} required />
                        </div>
                        <Button type="submit" disabled={isSubmitting || !guestName || !guestEmail}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {programPrice === 0 ? 'Complete Registration' : `Proceed to Payment (${program.price})`}
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>

            {/* This button is for logged-in users to register for events directly */}
            {loggedInUser && (
                 <Button size="lg" onClick={handleEventRegistration} disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {eventButtonText}
                </Button>
            )}
        </>
    );
}
