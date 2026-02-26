'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { usePaystackPayment } from 'react-paystack';
import { completeB2bRegistration } from '@/app/actions/b2b-registration';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, AlertCircle, CheckCircle2, Building2, Users, Mail, User, Lock, Phone } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const TIERS = {
    Startup: { label: 'Startup', maxSeats: 5, fee: 25000, color: 'bg-primary/10 text-primary' },
    SME: { label: 'SME', maxSeats: 20, fee: 75000, color: 'bg-accent/10 text-accent' },
    Corporate: { label: 'Corporate', maxSeats: null, fee: 150000, color: 'bg-secondary/10 text-secondary' },
};

function B2bRegistrationFormComponent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const tierKey = (searchParams.get('tier') || 'Startup') as keyof typeof TIERS;
    const tier = TIERS[tierKey] || TIERS.Startup;
    const registrationFee = parseInt(searchParams.get('fee') || String(tier.fee), 10);

    const [companyName, setCompanyName] = useState('');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [numLearners, setNumLearners] = useState(tier.maxSeats || 1);
    const [agreed, setAgreed] = useState(false);

    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    const paystackConfig = {
        reference: `b2b_${Date.now()}`,
        email: email,
        amount: registrationFee * 100,
        currency: 'KES',
        publicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY!,
        metadata: {
            custom_fields: [
                { display_name: "Full Name", variable_name: "full_name", value: name },
                { display_name: "Company", variable_name: "company", value: companyName },
                { display_name: "Subscription Tier", variable_name: "subscription_tier", value: tierKey },
                { display_name: "Number of Learners", variable_name: "num_learners", value: numLearners },
            ]
        }
    };

    const initializePayment = usePaystackPayment(paystackConfig);

    const onPaymentSuccess = async (reference: any) => {
        setLoading(true);
        setError(null);

        const result = await completeB2bRegistration({
            name, email, password, companyName,
            tier: tierKey,
            numLearners: Number(numLearners),
            period: tierKey === 'Startup' ? 6 : 12,
            amount: registrationFee,
            paymentReference: reference.reference
        });

        if (result.success) {
            setShowSuccessModal(true);
        } else {
            setError(result.error || 'An unknown error occurred during setup.');
            setLoading(false);
        }
    };

    const onPaymentClose = () => {
        setLoading(false);
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!agreed) {
            setError('Please agree to the Terms of Service and Privacy Policy to continue.');
            return;
        }
        setLoading(true);
        setError(null);
        (initializePayment as any)(onPaymentSuccess, onPaymentClose);
    };

    return (
        <>
            <Card className="w-full max-w-lg border-0 shadow-none">
                <CardHeader className="pb-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Badge className={`text-xs font-black uppercase tracking-widest rounded-tl-sm rounded-br-sm rounded-tr-none rounded-bl-none ${tier.color}`}>
                            {tier.label}
                        </Badge>
                        <span className="text-xs text-primary/50 font-semibold">
                            {tier.maxSeats ? `Up to ${tier.maxSeats} users` : 'Unlimited users'}
                        </span>
                    </div>
                    <CardTitle className="font-headline text-2xl text-primary">Register Your Organization</CardTitle>
                    <CardDescription className="text-primary/60">
                        Pay the one-time registration fee of <strong className="text-primary">KES {registrationFee.toLocaleString()}</strong> to activate your team's access.
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    <form onSubmit={handleSubmit} className="grid gap-4">
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
                                    className="h-11 border-primary/20 rounded-tl-lg rounded-br-lg rounded-tr-sm rounded-bl-sm"
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
                                    className="h-11 border-primary/20 rounded-tl-lg rounded-br-lg rounded-tr-sm rounded-bl-sm"
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
                                className="h-11 border-primary/20 rounded-tl-lg rounded-br-lg rounded-tr-sm rounded-bl-sm"
                            />
                        </div>

                        <div className="grid gap-1.5">
                            <Label htmlFor="regPassword" className="text-xs font-bold text-primary/60 uppercase tracking-widest flex items-center gap-1">
                                <Lock className="h-3 w-3" /> Password *
                            </Label>
                            <Input
                                id="regPassword"
                                type="password"
                                placeholder="Minimum 6 characters"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                required
                                minLength={6}
                                disabled={loading}
                                className="h-11 border-primary/20 rounded-tl-lg rounded-br-lg rounded-tr-sm rounded-bl-sm"
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
                                max={tier.maxSeats || 9999}
                                value={numLearners}
                                onChange={e => setNumLearners(parseInt(e.target.value, 10))}
                                required
                                disabled={loading}
                                className="h-11 border-primary/20 rounded-tl-lg rounded-br-lg rounded-tr-sm rounded-bl-sm"
                            />
                            {tier.maxSeats && (
                                <p className="text-xs text-primary/50">Max {tier.maxSeats} learners for {tier.label} plan</p>
                            )}
                        </div>

                        {/* Price Summary */}
                        <div className="bg-primary/5 border border-primary/10 rounded-tl-xl rounded-br-xl rounded-tr-sm rounded-bl-sm p-4">
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-sm text-primary/70 font-medium">Registration Fee ({tier.label})</span>
                                <span className="font-bold text-primary">KES {registrationFee.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center text-xs text-primary/50">
                                <span>{tierKey === 'Startup' ? '6-month' : '12-month'} access included</span>
                                <span>{numLearners} learner seat{numLearners > 1 ? 's' : ''}</span>
                            </div>
                        </div>

                        <div className="flex items-start space-x-3">
                            <Checkbox
                                id="regTerms"
                                checked={agreed}
                                onCheckedChange={(checked) => setAgreed(checked === true)}
                                disabled={loading}
                            />
                            <label htmlFor="regTerms" className="text-sm text-primary/70 leading-snug cursor-pointer">
                                I agree to the{' '}
                                <Link href="/terms" className="underline hover:text-primary font-semibold" target="_blank">Terms of Service</Link>
                                {' '}and{' '}
                                <Link href="/privacy" className="underline hover:text-primary font-semibold" target="_blank">Privacy Policy</Link>
                            </label>
                        </div>

                        {error && (
                            <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle>Registration Failed</AlertTitle>
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        <Button
                            type="submit"
                            className="w-full h-12 rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none bg-accent hover:bg-accent/90 text-white font-bold text-base"
                            disabled={loading || !agreed}
                        >
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            {loading ? 'Processing...' : `Pay KES ${registrationFee.toLocaleString()} & Register`}
                        </Button>

                        <p className="text-center text-xs text-primary/50">
                            Already registered?{' '}
                            <Link href="/login" className="text-accent font-bold hover:underline">Sign In</Link>
                        </p>
                    </form>
                </CardContent>
            </Card>

            <Dialog open={showSuccessModal} onOpenChange={() => { }}>
                <DialogContent className="sm:max-w-md bg-white border-0 shadow-2xl rounded-tl-3xl rounded-br-3xl rounded-tr-sm rounded-bl-sm">
                    <DialogHeader className="flex flex-col items-center text-center space-y-4 pt-6">
                        <div className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center">
                            <CheckCircle2 className="h-10 w-10 text-green-600" />
                        </div>
                        <DialogTitle className="text-2xl font-bold text-primary font-headline">Account Created!</DialogTitle>
                        <DialogDescription className="text-center text-base font-medium text-gray-600">
                            Welcome to KSS Corporate! Your organization <strong>{companyName}</strong> has been successfully registered. Log in to set up your team.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="flex flex-col gap-3 pt-4 pb-6 px-6">
                        <Button
                            className="w-full h-12 font-bold bg-primary hover:bg-primary/90 text-white rounded-tl-xl rounded-br-xl rounded-tr-sm rounded-bl-sm"
                            onClick={() => router.push('/login')}
                        >
                            Go to Login
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

export function B2bRegistrationForm() {
    return (
        <Suspense fallback={
            <Card className="w-full max-w-lg">
                <CardHeader>
                    <CardTitle className="font-headline text-2xl">Register Your Organization</CardTitle>
                </CardHeader>
                <CardContent>
                    <Loader2 className="mx-auto h-12 w-12 animate-spin text-muted-foreground" />
                </CardContent>
            </Card>
        }>
            <B2bRegistrationFormComponent />
        </Suspense>
    );
}
