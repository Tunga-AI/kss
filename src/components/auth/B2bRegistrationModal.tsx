'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePaystackPayment } from 'react-paystack';
import { completeB2bRegistration } from '@/app/actions/b2b-registration';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, AlertCircle, CheckCircle, CheckCircle2, Building2, Users, Mail, User, Lock, Phone } from 'lucide-react';
import Link from 'next/link';

export type TierType = 'Startup' | 'SME' | 'Corporate';

interface B2bRegistrationModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    tier: TierType;
    fee: number;
    maxSeats: number | null;
}

const TIERS_CONFIG = {
    Startup: { label: 'Startup', color: 'bg-primary/10 text-primary' },
    SME: { label: 'SME', color: 'bg-accent/10 text-accent' },
    Corporate: { label: 'Corporate', color: 'bg-secondary/10 text-secondary' },
};

export function B2bRegistrationModal({ open, onOpenChange, tier, fee, maxSeats }: B2bRegistrationModalProps) {
    const router = useRouter();
    const tierConfig = TIERS_CONFIG[tier] || TIERS_CONFIG.Startup;

    type Step = 'details' | 'account' | 'success';
    const [step, setStep] = useState<Step>('details');

    // Details
    const [companyName, setCompanyName] = useState('');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [numLearners, setNumLearners] = useState(maxSeats || 1);
    const [agreed, setAgreed] = useState(false);

    // Account details
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [paymentReference, setPaymentReference] = useState<string | null>(null);

    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const paystackConfig = {
        reference: `b2b_${Date.now()}`,
        email: email,
        amount: fee * 100,
        currency: 'KES',
        publicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY!,
        metadata: {
            custom_fields: [
                { display_name: "Full Name", variable_name: "full_name", value: name },
                { display_name: "Company", variable_name: "company", value: companyName },
                { display_name: "Subscription Tier", variable_name: "subscription_tier", value: tier },
                { display_name: "Number of Learners", variable_name: "num_learners", value: numLearners },
            ]
        }
    };

    const initializePayment = usePaystackPayment(paystackConfig);

    const handleDetailsSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!agreed) {
            setError('Please agree to the Terms of Service and Privacy Policy to continue.');
            return;
        }
        setLoading(true);
        setError(null);

        const onSuccess = (reference: any) => {
            setLoading(false);
            setPaymentReference(reference.reference);
            setStep('account');
        };

        const onClose = () => {
            setLoading(false);
        };

        (initializePayment as any)(onSuccess, onClose);
    };

    const handleAccountCreation = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }
        if (!paymentReference) {
            setError("Payment missing. Please try again.");
            return;
        }

        setLoading(true);
        setError(null);

        const result = await completeB2bRegistration({
            name, email, password, companyName,
            tier: tier,
            numLearners: Number(numLearners),
            period: tier === 'Startup' ? 6 : 12,
            amount: fee,
            paymentReference: paymentReference
        });

        if (result.success) {
            setStep('success');
            setLoading(false);
        } else {
            setError(result.error || 'An unknown error occurred during setup.');
            setLoading(false);
        }
    };

    const handleClose = (newOpen: boolean) => {
        if (!newOpen && step === 'success') {
            router.push('/login');
        }
        onOpenChange(newOpen);
    }

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-md bg-white border-0 shadow-2xl rounded-tl-3xl rounded-br-3xl rounded-tr-sm rounded-bl-sm p-0 gap-0 overflow-hidden">
                <DialogHeader className="bg-primary text-white p-6 pb-6">
                    <div className="flex items-center gap-2 mb-2">
                        <Badge className={`text-xs font-black uppercase tracking-widest rounded-tl-sm rounded-br-sm rounded-tr-none rounded-bl-none ${tierConfig.color}`}>
                            {tierConfig.label}
                        </Badge>
                        <span className="text-xs text-secondary/90 font-semibold">
                            {maxSeats ? `Up to ${maxSeats} users` : 'Unlimited users'}
                        </span>
                    </div>
                    {step === 'details' && (
                        <>
                            <DialogTitle className="font-headline text-2xl font-black flex items-center gap-2">Register Organization</DialogTitle>
                            <DialogDescription className="text-white/70 font-medium">
                                Enter your company details to proceed with the KES {fee.toLocaleString()} payment.
                            </DialogDescription>
                        </>
                    )}
                    {step === 'account' && (
                        <>
                            <DialogTitle className="font-headline text-2xl font-black flex items-center gap-2 text-white">Create Admin Account</DialogTitle>
                            <DialogDescription className="text-white/70 font-medium">
                                Payment successful! Now configure your password.
                            </DialogDescription>
                        </>
                    )}
                    {step === 'success' && (
                        <>
                            <DialogTitle className="text-2xl font-bold font-headline text-white flex items-center gap-2"><CheckCircle className="h-6 w-6 text-green-400" /> Account Created!</DialogTitle>
                        </>
                    )}
                </DialogHeader>

                <div className="p-6">
                    {step === 'details' && (
                        <form onSubmit={handleDetailsSubmit} className="grid gap-4 max-h-[60vh] overflow-y-auto pr-2">
                            <div className="grid gap-1.5">
                                <Label htmlFor="regCompanyName" className="text-xs font-bold text-primary/60 uppercase tracking-widest flex items-center gap-1">
                                    <Building2 className="h-3 w-3" /> Company Name *
                                </Label>
                                <Input
                                    id="regCompanyName"
                                    placeholder="Your Company Ltd."
                                    value={companyName}
                                    onChange={e => setCompanyName(e.target.value)}
                                    required
                                    disabled={loading}
                                    className="h-11 border-primary/20 rounded-tl-lg rounded-br-lg rounded-tr-sm rounded-bl-sm"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="grid gap-1.5">
                                    <Label htmlFor="regName" className="text-xs font-bold text-primary/60 uppercase tracking-widest flex items-center gap-1">
                                        <User className="h-3 w-3" /> Admin Name *
                                    </Label>
                                    <Input
                                        id="regName"
                                        placeholder="Full Name"
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                        required
                                        disabled={loading}
                                        className="h-11 border-primary/20 rounded-tl-lg rounded-br-lg"
                                    />
                                </div>
                                <div className="grid gap-1.5">
                                    <Label htmlFor="regPhone" className="text-xs font-bold text-primary/60 uppercase tracking-widest flex items-center gap-1">
                                        <Phone className="h-3 w-3" /> Phone
                                    </Label>
                                    <Input
                                        id="regPhone"
                                        type="tel"
                                        placeholder="+254 700 000 000"
                                        value={phone}
                                        onChange={e => setPhone(e.target.value)}
                                        disabled={loading}
                                        className="h-11 border-primary/20 rounded-tl-lg rounded-br-lg"
                                    />
                                </div>
                            </div>

                            <div className="grid gap-1.5">
                                <Label htmlFor="regEmail" className="text-xs font-bold text-primary/60 uppercase tracking-widest flex items-center gap-1">
                                    <Mail className="h-3 w-3" /> Work Email *
                                </Label>
                                <Input
                                    id="regEmail"
                                    type="email"
                                    placeholder="admin@company.com"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    required
                                    disabled={loading}
                                    className="h-11 border-primary/20 rounded-tl-lg rounded-br-lg"
                                />
                            </div>

                            <div className="grid gap-1.5">
                                <Label htmlFor="regNumLearners" className="text-xs font-bold text-primary/60 uppercase tracking-widest flex items-center gap-1">
                                    <Users className="h-3 w-3" /> Number of Learners *
                                </Label>
                                <Input
                                    id="regNumLearners"
                                    type="number"
                                    min="1"
                                    max={maxSeats || 9999}
                                    value={numLearners}
                                    onChange={e => setNumLearners(parseInt(e.target.value, 10))}
                                    required
                                    disabled={loading}
                                    className="h-11 border-primary/20 rounded-tl-lg rounded-br-lg"
                                />
                                {maxSeats && (
                                    <p className="text-xs text-primary/50">Max {maxSeats} learners for {tier} plan</p>
                                )}
                            </div>

                            <div className="flex items-start space-x-3 mt-2">
                                <Checkbox
                                    id="regTerms"
                                    checked={agreed}
                                    onCheckedChange={(checked) => setAgreed(checked === true)}
                                    disabled={loading}
                                />
                                <label htmlFor="regTerms" className="text-sm text-primary/70 leading-snug cursor-pointer">
                                    I agree to the{' '}
                                    <Link href="/terms" className="underline hover:text-primary font-semibold" target="_blank">Terms</Link>
                                    {' '}and{' '}
                                    <Link href="/privacy" className="underline hover:text-primary font-semibold" target="_blank">Privacy Policy</Link>
                                </label>
                            </div>

                            {error && (
                                <Alert variant="destructive" className="mt-2">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertTitle>Error</AlertTitle>
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}

                            <Button
                                type="submit"
                                className="w-full h-12 mt-2 rounded-tl-xl rounded-br-xl bg-accent hover:bg-accent/90 text-white font-bold text-base"
                                disabled={loading || !agreed}
                            >
                                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                {loading ? 'Processing...' : `Pay KES ${fee.toLocaleString()} & Continue`}
                            </Button>
                        </form>
                    )}

                    {step === 'account' && (
                        <form onSubmit={handleAccountCreation} className="space-y-6">
                            <div className="p-3 bg-green-50 text-green-700 rounded-lg text-sm font-medium flex items-center gap-2">
                                <CheckCircle className="h-4 w-4" /> Payment Verifed
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Create Password</Label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                        <Input
                                            required
                                            type="password"
                                            value={password}
                                            onChange={e => setPassword(e.target.value)}
                                            className="pl-10 h-12 bg-gray-50 border-primary/10 rounded-tl-lg rounded-br-lg"
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
                                            value={confirmPassword}
                                            onChange={e => setConfirmPassword(e.target.value)}
                                            className="pl-10 h-12 bg-gray-50 border-primary/10 rounded-tl-lg rounded-br-lg"
                                        />
                                    </div>
                                </div>
                            </div>

                            {error && (
                                <Alert variant="destructive">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}

                            <Button type="submit" className="w-full h-12 font-bold bg-primary hover:bg-primary/90 text-white rounded-tl-xl rounded-br-xl" disabled={loading}>
                                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Complete Account setup'}
                            </Button>
                        </form>
                    )}

                    {step === 'success' && (
                        <div className="text-center space-y-4">
                            <DialogDescription className="text-center text-base font-medium text-gray-600">
                                Your organization <strong>{companyName}</strong> has been successfully registered! You can now log in to the portal to configure your employees.
                            </DialogDescription>
                            <Button
                                className="w-full h-12 font-bold bg-accent hover:bg-accent/90 text-white mt-4 rounded-tl-xl rounded-br-xl"
                                onClick={() => router.push('/login')}
                            >
                                Go to Login
                            </Button>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
