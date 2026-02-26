'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { completeB2bRegistration } from '@/app/actions/b2b-registration';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Lock, Shield, CheckCircle, AlertCircle, ArrowRight, Building2 } from 'lucide-react';

function BusinessSetupContent() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const email = searchParams.get('email') || '';
    const name = searchParams.get('name') || '';
    const company = searchParams.get('company') || '';
    const tier = searchParams.get('tier') || '';
    const fee = parseInt(searchParams.get('fee') || '0', 10);
    const seats = parseInt(searchParams.get('seats') || '1', 10);
    const txRef = searchParams.get('txRef') || '';

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [done, setDone] = useState(false);

    // Guard: if missing required params, redirect
    useEffect(() => {
        if (!email || !company || !tier) {
            router.replace('/for-business');
        }
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (password.length < 6) {
            setError('Password must be at least 6 characters.');
            return;
        }
        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        setLoading(true);

        const result = await completeB2bRegistration({
            name,
            email,
            password,
            companyName: company,
            tier: tier as any,
            numLearners: seats,
            period: tier === 'Startup' ? 6 : 12,
            amount: fee,
            paymentReference: txRef,
        });

        if (result.success) {
            setDone(true);
            // Small delay so user sees success, then push to business portal
            setTimeout(() => router.push('/b'), 2000);
        } else {
            setError(result.error || 'Account setup failed. Please contact support at hi@kss.or.ke');
        }
        setLoading(false);
    };

    if (done) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                <Card className="w-full max-w-md text-center border-0 shadow-2xl rounded-tl-3xl rounded-br-3xl rounded-tr-none rounded-bl-none overflow-hidden">
                    <CardContent className="p-12 space-y-6">
                        <div className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                            <CheckCircle className="h-10 w-10 text-green-600" />
                        </div>
                        <div>
                            <h2 className="font-headline text-2xl font-bold text-primary mb-2">Account Created!</h2>
                            <p className="text-primary/60">
                                <strong>{company}</strong> is set up. Taking you to your business portal…
                            </p>
                        </div>
                        <Loader2 className="h-6 w-6 animate-spin text-accent mx-auto" />
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="w-full max-w-md">
                {/* Payment confirmed banner */}
                <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl p-4 mb-6 text-green-700">
                    <CheckCircle className="h-5 w-5 flex-shrink-0" />
                    <div className="text-sm">
                        <span className="font-bold">Payment Confirmed</span>
                        <span className="text-green-600"> — KES {fee.toLocaleString()} received</span>
                        <br />
                        <span className="text-xs text-green-500">Reference: {txRef || 'N/A'}</span>
                    </div>
                </div>

                <Card className="border-0 shadow-2xl rounded-tl-3xl rounded-br-3xl rounded-tr-none rounded-bl-none overflow-hidden">
                    <CardHeader className="bg-primary text-white p-8">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="h-10 w-10 bg-accent/20 rounded-full flex items-center justify-center">
                                <Building2 className="h-5 w-5 text-accent" />
                            </div>
                            <div>
                                <p className="text-white/60 text-xs font-semibold uppercase tracking-widest">{tier} Plan</p>
                                <p className="text-white font-bold">{company}</p>
                            </div>
                        </div>
                        <CardTitle className="font-headline text-2xl font-black text-white">
                            Create Your Admin Account
                        </CardTitle>
                        <CardDescription className="text-white/70">
                            Set a password for <span className="text-white font-semibold">{email}</span>
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="p-8">
                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* Pre-filled name (read-only) */}
                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold text-primary/60 uppercase tracking-widest">Admin Name</Label>
                                <Input value={name} disabled className="bg-gray-50 border-gray-200 h-11" />
                            </div>

                            {/* Password */}
                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold text-primary/60 uppercase tracking-widest flex items-center gap-1">
                                    <Lock className="h-3 w-3" /> Create Password
                                </Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <Input
                                        type="password"
                                        placeholder="Minimum 6 characters"
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        required
                                        minLength={6}
                                        disabled={loading}
                                        className="pl-10 h-12 border-primary/20 rounded-tl-lg rounded-br-lg rounded-tr-sm rounded-bl-sm"
                                    />
                                </div>
                            </div>

                            {/* Confirm password */}
                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold text-primary/60 uppercase tracking-widest flex items-center gap-1">
                                    <Shield className="h-3 w-3" /> Confirm Password
                                </Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <Input
                                        type="password"
                                        placeholder="Repeat password"
                                        value={confirmPassword}
                                        onChange={e => setConfirmPassword(e.target.value)}
                                        required
                                        disabled={loading}
                                        className="pl-10 h-12 border-primary/20 rounded-tl-lg rounded-br-lg rounded-tr-sm rounded-bl-sm"
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
                                className="w-full h-14 bg-accent hover:bg-accent/90 text-white font-black text-base rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none shadow-lg"
                                disabled={loading}
                            >
                                {loading
                                    ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Setting up your account…</>
                                    : <><ArrowRight className="mr-2 h-5 w-5" /> Activate Business Account</>}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <p className="text-center text-xs text-gray-400 mt-4">
                    Having trouble? Email us at{' '}
                    <a href="mailto:hi@kss.or.ke" className="text-accent underline">hi@kss.or.ke</a>
                </p>
            </div>
        </div>
    );
}

export default function BusinessSetupPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="h-8 w-8 animate-spin text-accent" />
            </div>
        }>
            <BusinessSetupContent />
        </Suspense>
    );
}
