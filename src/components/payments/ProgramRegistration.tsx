'use client';

import React, { useState, useMemo } from 'react';
import { usePaystackPayment } from 'react-paystack';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUser } from '@/firebase';
import { useFirestore } from '@/firebase';
import type { Program } from '@/lib/program-types';
import { addTransaction } from '@/lib/transactions';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface ProgramRegistrationProps {
    program: Program;
}

const parsePrice = (price: string | undefined): number => {
    if (!price || price.toLowerCase() === 'free') {
        return 0;
    }
    // Remove currency symbols, commas, and other non-numeric characters except for the decimal point
    const numericString = price.replace(/[^0-9.]/g, '');
    const amount = parseFloat(numericString);
    return isNaN(amount) ? 0 : amount;
};

export function ProgramRegistration({ program }: ProgramRegistrationProps) {
    const { user: loggedInUser, loading: userLoading } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();

    const [open, setOpen] = useState(false);
    const [guestName, setGuestName] = useState('');
    const [guestEmail, setGuestEmail] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

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
                {
                    display_name: "Full Name",
                    variable_name: "full_name",
                    value: userName,
                },
                {
                    display_name: "Program",
                    variable_name: "program",
                    value: program.title
                }
            ]
        }
    };

    const initializePayment = usePaystackPayment(paystackConfig);

    const onPaymentSuccess = (reference: any) => {
        if (!firestore) return;
        
        addTransaction(firestore, {
            learnerName: userName,
            learnerEmail: userEmail,
            program: program.title,
            amount: programPrice,
            currency: 'KES',
            status: 'Success',
            paystackReference: reference.reference,
        });

        toast({
            title: "Registration Successful!",
            description: "Thank you for registering. You'll receive a confirmation email shortly.",
        });
        setIsSubmitting(false);
        setOpen(false);
    };

    const onPaymentClose = () => {
        setIsSubmitting(false);
        toast({
            variant: "destructive",
            title: "Payment window closed",
            description: "Your registration was not completed.",
        });
    };

    const handleGuestSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        initializePayment(onPaymentSuccess, onPaymentClose);
    };

    const handleRegisterClick = () => {
        if (loggedInUser) {
            setIsSubmitting(true);
            initializePayment(onPaymentSuccess, onPaymentClose);
        }
    };
    
    const handleFreeEnrollment = () => {
        if (!firestore) return;
        setIsSubmitting(true);

        if (!userName || !userEmail) {
            toast({
                variant: "destructive",
                title: "Details Required",
                description: "Please fill out your name and email to enroll.",
            });
            setIsSubmitting(false);
            setOpen(true);
            return;
        }

        addTransaction(firestore, {
            learnerName: userName,
            learnerEmail: userEmail,
            program: program.title,
            amount: 0,
            currency: 'KES',
            status: 'Success',
            paystackReference: `free_enroll_${new Date().getTime()}`,
        });

        toast({
            title: "Enrollment Successful!",
            description: `You are now enrolled in ${program.title}.`,
        });
        setIsSubmitting(false);
        setOpen(false);
    };

    const handleGuestFreeEnrollmentSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleFreeEnrollment();
    };

    if (userLoading) {
        return <Button size="lg" disabled>Loading...</Button>;
    }
    
    if (programPrice === 0) {
        if (!loggedInUser) {
            return (
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button size="lg">Enroll for Free</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Enroll in {program.title}</DialogTitle>
                            <DialogDescription>
                                This is a free program. Please provide your details to enroll.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleGuestFreeEnrollmentSubmit} className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name-free">Full Name</Label>
                                <Input id="name-free" value={guestName} onChange={(e) => setGuestName(e.target.value)} required />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="email-free">Email Address</Label>
                                <Input id="email-free" type="email" value={guestEmail} onChange={(e) => setGuestEmail(e.target.value)} required />
                            </div>
                            <Button type="submit" disabled={isSubmitting || !guestName || !guestEmail}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Complete Enrollment
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            );
        }
        
        return (
            <Button size="lg" onClick={handleFreeEnrollment} disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Enroll for Free
            </Button>
        );
    }

    if (!loggedInUser) {
        return (
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                    <Button size="lg">Register Now</Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Register for {program.title}</DialogTitle>
                        <DialogDescription>
                            Please provide your details to continue to payment.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleGuestSubmit} className="grid gap-4 py-4">
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
                            Proceed to Payment ({program.price})
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>
        );
    }
    
    return (
         <Button size="lg" onClick={handleRegisterClick} disabled={isSubmitting}>
             {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
             Register Now ({program.price})
        </Button>
    );
}
