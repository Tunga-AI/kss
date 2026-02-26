'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { completeB2bRegistration } from '@/app/actions/b2b-registration';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
    Loader2, AlertCircle, CheckCircle, CheckCircle2,
    Building2, Users, Mail, User, Lock, Phone, ArrowRight, Shield, Zap
} from 'lucide-react';
import Link from 'next/link';

export type TierType = 'Startup' | 'SME' | 'Corporate';

type Step = 'details' | 'account' | 'success';

interface B2bRegistrationSectionProps {
    tier: TierType;
    fee: number;
    maxSeats: number | null;
    onCancel?: () => void;
    /** Boot the form straight into a step (used after payment redirect) */
    initialStep?: Step;
    /** Pre-fill form values from URL params after redirect */
    initialData?: {
        name?: string;
        email?: string;
        companyName?: string;
        numLearners?: number;
    };
    /** Payment reference captured from Paystack redirect */
    initialReference?: string;
}

const TIERS_CONFIG = {
    Startup: { label: 'Startup', color: 'bg-primary/10 text-primary' },
    SME: { label: 'SME', color: 'bg-accent text-white' },
    Corporate: { label: 'Corporate', color: 'bg-secondary/10 text-secondary' },
};

export function B2bRegistrationSection({
    tier, fee, maxSeats, onCancel,
    initialStep = 'details',
    initialData,
    initialReference,
}: B2bRegistrationSectionProps) {
    const router = useRouter();
    const tierConfig = TIERS_CONFIG[tier] || TIERS_CONFIG.Startup;

    const [step, setStep] = useState<Step>(initialStep);
    const [companyName, setCompanyName] = useState(initialData?.companyName || '');
    const [name, setName] = useState(initialData?.name || '');
    const [email, setEmail] = useState(initialData?.email || '');
    const [phone, setPhone] = useState('');
    const [numLearners, setNumLearners] = useState(initialData?.numLearners || maxSeats || 1);
    const [agreed, setAgreed] = useState(false);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [paymentReference, setPaymentReference] = useState<string | null>(initialReference || null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleDetailsSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!agreed) {
            setError('Please agree to the Terms of Service and Privacy Policy to continue.');
            return;
        }
        if (!email || !name || !companyName) {
            setError('Please fill in all required fields.');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/paystack/initialize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email,
                    amount: fee,
                    reference: `b2b_${Date.now()}`,
                    metadata: {
                        learnerName: name,
                        learnerEmail: email,
                        phone,
                        companyName,
                        tier,
                        numLearners,
                        redirectUrl: `${window.location.origin}/for-business?b2b_step=account&b2b_email=${encodeURIComponent(email)}&b2b_name=${encodeURIComponent(name)}&b2b_company=${encodeURIComponent(companyName)}&b2b_tier=${tier}&b2b_fee=${fee}&b2b_seats=${numLearners}`,
                    }
                }),
            });

            const result = await response.json();

            if (!result.success) {
                throw new Error(result.message || 'Failed to initialize payment');
            }

            window.location.href = result.data.authorization_url;

        } catch (err: any) {
            setError(err.message || 'Failed to initialize payment. Please try again.');
            setLoading(false);
        }
    };

    const handleAccountCreation = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }
        if (!paymentReference) {
            setError('Payment reference missing. Please try again.');
            return;
        }

        setLoading(true);
        setError(null);

        const result = await completeB2bRegistration({
            name, email, password, companyName,
            tier,
            numLearners: Number(numLearners),
            period: tier === 'Startup' ? 6 : 12,
            amount: fee,
            paymentReference,
        });

        if (result.success) {
            setStep('success');
        } else {
            setError(result.error || 'An unknown error occurred during setup.');
        }
        setLoading(false);
    };

    return (
        <Card className="bg-white border-primary/10 shadow-2xl overflow-hidden rounded-none rounded-tl-2xl rounded-br-2xl">
            {/* Header */}
            <CardHeader className="bg-primary text-white p-6">
                <div className="flex items-center justify-between mb-2">
                    <Badge className={`text-xs font-black uppercase tracking-widest rounded-tl-sm rounded-br-sm rounded-tr-none rounded-bl-none ${tierConfig.color}`}>
                        {tierConfig.label} Plan
                    </Badge>
                    <span className="text-white/60 text-xs font-semibold">
                        {maxSeats ? `Up to ${maxSeats} users` : 'Unlimited users'}
                    </span>
                </div>
                {step === 'details' && (
                    <>
                        <CardTitle className="font-headline text-2xl font-black text-white">
                            Register Your Organisation
                        </CardTitle>
                        <CardDescription className="text-white/70 font-medium">
                            Complete your details and pay KES {fee.toLocaleString()} to get started.
                        </CardDescription>
                    </>
                )}
                {step === 'account' && (
                    <>
                        <CardTitle className="font-headline text-2xl font-black text-white">
                            Create Admin Account
                        </CardTitle>
                        <CardDescription className="text-white/70 font-medium">
                            Payment verified! Now set your password to complete setup.
                        </CardDescription>
                    </>
                )}
                {step === 'success' && (
                    <CardTitle className="font-headline text-2xl font-black text-white flex items-center gap-2">
                        <CheckCircle className="h-6 w-6 text-green-400" />
                        Account Created!
                    </CardTitle>
                )}
            </CardHeader>

            <CardContent className="p-6">
                {/* ── STEP 1: Details + Payment ── */}
                {step === 'details' && (
                    <form onSubmit={handleDetailsSubmit} className="space-y-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="b2b-company" className="text-xs font-bold text-primary/60 uppercase tracking-widest flex items-center gap-1">
                                <Building2 className="h-3 w-3" /> Company Name *
                            </Label>
                            <Input
                                id="b2b-company"
                                placeholder="Your Company Ltd."
                                value={companyName}
                                onChange={e => setCompanyName(e.target.value)}
                                required
                                disabled={loading}
                                className="h-11 border-primary/20 rounded-tl-lg rounded-br-lg rounded-tr-sm rounded-bl-sm"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="b2b-name" className="text-xs font-bold text-primary/60 uppercase tracking-widest flex items-center gap-1">
                                    <User className="h-3 w-3" /> Admin Name *
                                </Label>
                                <Input
                                    id="b2b-name"
                                    placeholder="Full Name"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    required
                                    disabled={loading}
                                    className="h-11 border-primary/20 rounded-tl-lg rounded-br-lg rounded-tr-sm rounded-bl-sm"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="b2b-phone" className="text-xs font-bold text-primary/60 uppercase tracking-widest flex items-center gap-1">
                                    <Phone className="h-3 w-3" /> Phone
                                </Label>
                                <Input
                                    id="b2b-phone"
                                    type="tel"
                                    placeholder="+254 700 000 000"
                                    value={phone}
                                    onChange={e => setPhone(e.target.value)}
                                    disabled={loading}
                                    className="h-11 border-primary/20 rounded-tl-lg rounded-br-lg rounded-tr-sm rounded-bl-sm"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="b2b-email" className="text-xs font-bold text-primary/60 uppercase tracking-widest flex items-center gap-1">
                                <Mail className="h-3 w-3" /> Work Email *
                            </Label>
                            <Input
                                id="b2b-email"
                                type="email"
                                placeholder="admin@company.com"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                required
                                disabled={loading}
                                className="h-11 border-primary/20 rounded-tl-lg rounded-br-lg rounded-tr-sm rounded-bl-sm"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="b2b-learners" className="text-xs font-bold text-primary/60 uppercase tracking-widest flex items-center gap-1">
                                <Users className="h-3 w-3" /> Number of Learners *
                            </Label>
                            <Input
                                id="b2b-learners"
                                type="number"
                                min="1"
                                max={maxSeats || 9999}
                                value={numLearners}
                                onChange={e => setNumLearners(parseInt(e.target.value, 10))}
                                required
                                disabled={loading}
                                className="h-11 border-primary/20 rounded-tl-lg rounded-br-lg rounded-tr-sm rounded-bl-sm"
                            />
                            {maxSeats && (
                                <p className="text-xs text-primary/50">Max {maxSeats} learners for {tier} plan</p>
                            )}
                        </div>

                        <div className="flex items-start space-x-3 mt-2">
                            <Checkbox
                                id="b2b-terms"
                                checked={agreed}
                                onCheckedChange={(checked) => setAgreed(checked === true)}
                                disabled={loading}
                            />
                            <label htmlFor="b2b-terms" className="text-sm text-primary/70 leading-snug cursor-pointer">
                                I agree to the{' '}
                                <Link href="/terms" className="underline hover:text-primary font-semibold" target="_blank">Terms</Link>
                                {' '}and{' '}
                                <Link href="/privacy" className="underline hover:text-primary font-semibold" target="_blank">Privacy Policy</Link>
                            </label>
                        </div>

                        {error && (
                            <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle>Error</AlertTitle>
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        <div className="pt-2 space-y-3">
                            <Button
                                type="submit"
                                className="w-full h-14 rounded-tl-xl rounded-br-xl rounded-tr-sm rounded-bl-sm bg-accent hover:bg-accent/90 text-white font-black text-base shadow-lg"
                                disabled={loading || !agreed}
                            >
                                {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Zap className="mr-2 h-5 w-5" />}
                                {loading ? 'Processing...' : `Pay KES ${fee.toLocaleString()} & Continue`}
                            </Button>
                            {onCancel && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    className="w-full h-10 text-primary/60 hover:text-primary font-semibold"
                                    onClick={onCancel}
                                    disabled={loading}
                                >
                                    ← Change Plan
                                </Button>
                            )}
                        </div>
                    </form>
                )}

                {/* ── STEP 2: Account Setup ── */}
                {step === 'account' && (
                    <form onSubmit={handleAccountCreation} className="space-y-5">
                        {/* Summary of who is registering */}
                        <div className="p-4 bg-green-50 border border-green-200 rounded-xl space-y-1">
                            <div className="flex items-center gap-2 text-green-700 font-semibold text-sm">
                                <CheckCircle className="h-4 w-4" /> Payment Verified
                            </div>
                            {(name || companyName) && (
                                <p className="text-xs text-green-600 pl-6">
                                    {companyName && <><span className="font-bold">{companyName}</span> · </>}{name && <span>{name}</span>}{email && <> · {email}</>}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-primary/60 uppercase tracking-widest flex items-center gap-1">
                                <Lock className="h-3 w-3" /> Create Password
                            </Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    required
                                    type="password"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    className="pl-10 h-12 bg-gray-50 border-primary/10 rounded-tl-lg rounded-br-lg rounded-tr-sm rounded-bl-sm"
                                    minLength={6}
                                    placeholder="Min. 6 characters"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-primary/60 uppercase tracking-widest flex items-center gap-1">
                                <Shield className="h-3 w-3" /> Confirm Password
                            </Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    required
                                    type="password"
                                    value={confirmPassword}
                                    onChange={e => setConfirmPassword(e.target.value)}
                                    className="pl-10 h-12 bg-gray-50 border-primary/10 rounded-tl-lg rounded-br-lg rounded-tr-sm rounded-bl-sm"
                                    placeholder="Confirm password"
                                />
                            </div>
                        </div>

                        {error && (
                            <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        <Button
                            type="submit"
                            className="w-full h-14 font-black bg-primary hover:bg-primary/90 text-white rounded-tl-xl rounded-br-xl rounded-tr-sm rounded-bl-sm"
                            disabled={loading}
                        >
                            {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <ArrowRight className="mr-2 h-5 w-5" />}
                            {loading ? 'Setting up...' : 'Complete Account Setup'}
                        </Button>
                    </form>
                )}

                {/* ── STEP 3: Success ── */}
                {step === 'success' && (
                    <div className="text-center space-y-6 py-4">
                        <div className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                            <CheckCircle2 className="h-10 w-10 text-green-600" />
                        </div>
                        <div>
                            <p className="text-base font-semibold text-gray-700 leading-relaxed">
                                Your organisation <strong>{companyName}</strong> has been registered successfully!
                                You can now access the business portal to add your learners.
                            </p>
                        </div>
                        <Button
                            className="w-full h-14 font-black bg-accent hover:bg-accent/90 text-white rounded-tl-xl rounded-br-xl rounded-tr-sm rounded-bl-sm"
                            onClick={() => router.push('/business')}
                        >
                            Go to Your Dashboard
                            <ArrowRight className="ml-2 h-5 w-5" />
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
