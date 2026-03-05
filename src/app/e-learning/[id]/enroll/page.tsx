'use client';

import { useParams, notFound, useRouter } from 'next/navigation';
import { useUsersFirestore, useAuth } from '@/firebase';
import { useUser } from '@/firebase/auth/use-user';
import { collection, query, where, limit, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { useCollection } from '@/firebase/firestore/use-collection';
import { addUser } from '@/lib/users';
import type { Program } from '@/lib/program-types';
import { useMemo, useState } from 'react';
import { Header } from '@/components/shared/header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
    Loader2, CheckCircle, Lock, Mail, Phone, User as UserIcon,
    ArrowRight, BookOpen, Shield, Eye, EyeOff, CreditCard
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';

// ─── Step Types ───────────────────────────────────────────────────────────────
type Step = 'details' | 'payment' | 'account' | 'success';

const STEP_LABELS: Record<Step, string> = {
    details: 'Your Details',
    payment: 'Secure Payment',
    account: 'Create Account',
    success: 'All Set!',
};

const STEPS: Step[] = ['details', 'payment', 'account', 'success'];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function parsePrice(price: string | number | undefined): number {
    if (price === undefined || price === null || price === '') return 0;
    if (typeof price === 'number') return isNaN(price) ? 0 : price;
    if (price.toLowerCase() === 'free') return 0;
    return parseFloat(price.replace(/[^0-9.]/g, '')) || 0;
}

function formatKenyanPhone(raw: string): string | null {
    const cleaned = raw.replace(/\D/g, '');
    if (cleaned.startsWith('254') && cleaned.length === 12) return `+${cleaned}`;
    if (cleaned.startsWith('0') && cleaned.length === 10) return `+254${cleaned.slice(1)}`;
    if (cleaned.length === 9) return `+254${cleaned}`;
    return null;
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ElearningEnrollPage() {
    const params = useParams();
    const slug = Array.isArray(params.id) ? params.id[0] : params.id as string;
    const router = useRouter();
    const { toast } = useToast();
    const firestore = useUsersFirestore();
    const auth = useAuth();
    const { user: loggedInUser } = useUser();

    // ── Load course ──────────────────────────────────────────────────────────
    const programQuery = useMemo(() => {
        if (!firestore || !slug) return null;
        return query(collection(firestore, 'programs'), where('slug', '==', slug), limit(1));
    }, [firestore, slug]);
    const { data: programs, loading: courseLoading } = useCollection<Program>(programQuery as any);
    const course = programs?.[0];

    // ── Form state ───────────────────────────────────────────────────────────
    const [step, setStep] = useState<Step>('details');
    const [submitting, setSubmitting] = useState(false);
    const [paymentRef, setPaymentRef] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [form, setForm] = useState({
        name: loggedInUser?.name || '',
        email: loggedInUser?.email || '',
        phone: '',
        password: '',
        confirmPassword: '',
    });

    const coursePrice = useMemo(() => parsePrice(course?.price), [course]);
    const isFree = coursePrice === 0;
    const priceLabel = isFree ? 'Free' : `KES ${coursePrice.toLocaleString()}`;

    // ── Trigger Paystack via Backend Redirect ────────────────────────────────
    const triggerPayment = async () => {
        setStep('payment');
        try {
            console.log('🚀 Initializing e-learning payment...');
            const response = await fetch('/api/paystack/initialize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: loggedInUser?.email || form.email,
                    amount: coursePrice,
                    reference: `KSS_EL_${Date.now()}`,
                    metadata: {
                        learnerName: loggedInUser?.name || form.name,
                        learnerEmail: loggedInUser?.email || form.email,
                        phone: form.phone,
                        program: course?.programName || course?.title || 'E-Learning',
                        programId: course?.id,
                        isElearning: true,
                        programSlug: slug,
                        userId: loggedInUser?.id || null,
                        redirectUrl: loggedInUser
                            ? `/e-learning/${slug}/learn`
                            : `/login?flow=setup_account&email=${form.email}&name=${form.name}&phone=${form.phone}&programId=${course?.id}&programTitle=${encodeURIComponent(course?.programName || course?.title || '')}&isElearning=true`
                    }
                }),
            });

            const result = await response.json();

            if (!result.success) {
                throw new Error(result.message || 'Failed to initialize payment');
            }

            console.log('✅ Payment initialized, redirecting to Paystack...');
            window.location.href = result.data.authorization_url;

        } catch (error: any) {
            console.error('❌ Payment initialization error:', error);
            setStep('details');
            toast({
                variant: 'destructive',
                title: 'Payment Error',
                description: error.message || 'Failed to initialize payment. Please try again.'
            });
        }
    };

    // ── Record enrollment in Firestore ───────────────────────────────────────
    const recordEnrollment = async (userId: string, email: string, ref: string) => {
        if (!firestore || !course) return;
        const enrollRef = doc(firestore, 'elearningEnrollments', `${userId}_${course.id}`);
        await setDoc(enrollRef, {
            userId,
            email,
            programId: course.id,
            programSlug: course.slug,
            programName: course.programName,
            paystackReference: ref,
            enrolledAt: serverTimestamp(),
            status: 'active',
        }, { merge: true });
    };

    // ── Step 1: Submit details → trigger Paystack (or skip for free) ─────────
    const handleDetailsSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name.trim() || form.name.trim().length < 2) {
            toast({ variant: 'destructive', title: 'Invalid Name', description: 'Please enter your full name.' });
            return;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
            toast({ variant: 'destructive', title: 'Invalid Email', description: 'Please enter a valid email address.' });
            return;
        }
        const phone = formatKenyanPhone(form.phone);
        if (!phone) {
            toast({ variant: 'destructive', title: 'Invalid Phone', description: 'Enter a valid Kenyan number, e.g. 0712 345 678.' });
            return;
        }

        if (isFree) {
            // No Paystack needed — go straight to account creation (or learn if logged in)
            if (loggedInUser) {
                await recordEnrollment(loggedInUser.id, loggedInUser.email || form.email, 'FREE');
                router.push(`/e-learning/${slug}/learn`);
            } else {
                setStep('account');
            }
        } else {
            triggerPayment();
        }
    };

    // ── Step 3: Create account after payment ─────────────────────────────────
    const handleAccountCreation = async (e: React.FormEvent) => {
        e.preventDefault();
        if (form.password.length < 6) {
            toast({ variant: 'destructive', title: 'Password too short', description: 'Password must be at least 6 characters.' });
            return;
        }
        if (form.password !== form.confirmPassword) {
            toast({ variant: 'destructive', title: 'Passwords mismatch', description: 'The two passwords do not match.' });
            return;
        }
        if (!auth || !firestore) return;

        setSubmitting(true);
        try {
            // 1. Create Firebase Auth account
            const credential = await createUserWithEmailAndPassword(auth, form.email, form.password);
            await updateProfile(credential.user, { displayName: form.name });

            // 2. Create user + learner records in Firestore (addUser does both)
            const userId = await addUser(firestore, {
                name: form.name,
                email: form.email,
                phone: formatKenyanPhone(form.phone) || form.phone,
                role: 'Learner',
                status: 'Active',
            });

            // 3. Record enrollment
            await recordEnrollment(userId!, credential.user.email || form.email, paymentRef || 'FREE');

            setStep('success');
        } catch (err: any) {
            let msg = 'Could not create your account. Please try again.';
            if (err.code === 'auth/email-already-in-use') {
                msg = 'This email already has an account. Please log in instead.';
            }
            toast({ variant: 'destructive', title: 'Account Error', description: msg });
        } finally {
            setSubmitting(false);
        }
    };

    // ─────────────────────────────────────────────────────────────────────────
    if (courseLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-accent animate-spin" />
                    <p className="text-primary/50 font-bold uppercase tracking-widest text-xs">Loading...</p>
                </div>
            </div>
        );
    }
    if (!course || course.programType !== 'E-Learning') notFound();

    const title = course.programName || course.title || 'E-Learning Course';
    const thumbnail = course.imageUrl || course.image;
    const currentStepIdx = STEPS.indexOf(step);

    // ─────────────────────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Header />

            <main className="flex-1 pt-24 pb-16">
                <div className="container mx-auto max-w-5xl px-6">

                    {/* ── Progress steps ── */}
                    <div className="flex items-center justify-center gap-2 mb-10">
                        {STEPS.filter(s => s !== 'payment').map((s, idx) => {
                            const realIdx = ['details', 'account', 'success'].indexOf(s);
                            const currentRealIdx = ['details', 'account', 'success'].indexOf(
                                step === 'payment' ? 'details' : step
                            );
                            const done = realIdx < currentRealIdx;
                            const active = realIdx === currentRealIdx;
                            return (
                                <div key={s} className="flex items-center gap-2">
                                    <div className={cn(
                                        "w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all",
                                        done ? "bg-green-500 text-white" : active ? "bg-primary text-white shadow-lg shadow-primary/30" : "bg-gray-200 text-gray-400"
                                    )}>
                                        {done ? <CheckCircle className="h-4 w-4" /> : idx + 1}
                                    </div>
                                    <span className={cn("text-xs font-bold hidden sm:block", active ? "text-primary" : "text-gray-400")}>
                                        {STEP_LABELS[s]}
                                    </span>
                                    {idx < 2 && <div className={cn("w-8 h-0.5 hidden sm:block", done ? "bg-green-500" : "bg-gray-200")} />}
                                </div>
                            );
                        })}
                    </div>

                    <div className="grid lg:grid-cols-5 gap-8 items-start">

                        {/* ── LEFT: Course summary card ── */}
                        <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 sticky top-24">
                            <div className="relative aspect-video bg-primary/5 overflow-hidden">
                                {thumbnail ? (
                                    <Image src={thumbnail} alt={title} fill className="object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <BookOpen className="h-12 w-12 text-primary/20" />
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                <div className="absolute bottom-3 left-3 right-3">
                                    <span className="bg-accent text-white text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-sm">E-Learning</span>
                                </div>
                            </div>
                            <div className="p-5">
                                <h2 className="font-bold text-primary text-lg leading-snug mb-3">{title}</h2>
                                <div className="flex items-center justify-between py-3 border-t border-gray-100">
                                    <span className="text-gray-500 text-sm">Course Price</span>
                                    <span className="text-2xl font-black text-primary">{priceLabel}</span>
                                </div>
                                <div className="space-y-2 pt-3 border-t border-gray-100 text-xs text-gray-500">
                                    <div className="flex items-center gap-2"><Shield className="h-3.5 w-3.5 text-green-500" /> Secure payment via Paystack</div>
                                    <div className="flex items-center gap-2"><CheckCircle className="h-3.5 w-3.5 text-green-500" /> Lifetime access</div>
                                    <div className="flex items-center gap-2"><CheckCircle className="h-3.5 w-3.5 text-green-500" /> Certificate on completion</div>
                                </div>
                            </div>
                        </div>

                        {/* ── RIGHT: Step forms ── */}
                        <div className="lg:col-span-3">
                            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">

                                {/* Card header */}
                                <div className="bg-primary p-7 text-white">
                                    <p className="text-white/50 text-[10px] font-black uppercase tracking-widest mb-1">
                                        Step {step === 'payment' || step === 'details' ? 1 : step === 'account' ? 2 : 3} of 3
                                    </p>
                                    <h1 className="text-2xl font-black">
                                        {step === 'details' && 'Tell us about yourself'}
                                        {step === 'payment' && 'Processing Payment...'}
                                        {step === 'account' && 'Create your login'}
                                        {step === 'success' && 'You are enrolled! 🎉'}
                                    </h1>
                                    <p className="text-white/60 text-sm mt-1">
                                        {step === 'details' && `We need a few details before your ${isFree ? 'free enrollment' : `${priceLabel} payment`}.`}
                                        {step === 'payment' && 'Complete payment in the Paystack popup. Do not close this page.'}
                                        {step === 'account' && 'Payment confirmed. Set a password so you can log in anytime.'}
                                        {step === 'success' && 'Your account is ready. Start learning immediately!'}
                                    </p>
                                </div>

                                <div className="p-7">

                                    {/* ── STEP 1: Personal Details ── */}
                                    {(step === 'details' || step === 'payment') && (
                                        <form onSubmit={handleDetailsSubmit} className="space-y-5">

                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-black uppercase tracking-widest text-primary/50">Full Name</Label>
                                                <div className="relative">
                                                    <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/30" />
                                                    <Input
                                                        required
                                                        value={form.name}
                                                        onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                                        placeholder="e.g. John Kamau"
                                                        className="pl-11 h-14 bg-gray-50 border-gray-200 rounded-tl-xl rounded-br-xl font-medium focus:ring-primary"
                                                        disabled={step === 'payment'}
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-black uppercase tracking-widest text-primary/50">Email Address</Label>
                                                <div className="relative">
                                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/30" />
                                                    <Input
                                                        required
                                                        type="email"
                                                        value={form.email}
                                                        onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                                                        placeholder="john@example.com"
                                                        className="pl-11 h-14 bg-gray-50 border-gray-200 rounded-tl-xl rounded-br-xl font-medium"
                                                        disabled={step === 'payment'}
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-black uppercase tracking-widest text-primary/50">Phone Number</Label>
                                                <div className="relative">
                                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/30" />
                                                    <Input
                                                        required
                                                        type="tel"
                                                        value={form.phone}
                                                        onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                                                        placeholder="0712 345 678"
                                                        className="pl-11 h-14 bg-gray-50 border-gray-200 rounded-tl-xl rounded-br-xl font-medium"
                                                        disabled={step === 'payment'}
                                                    />
                                                </div>
                                                <p className="text-[10px] text-gray-400 ml-1">Used for payment and course communications</p>
                                            </div>

                                            <Button
                                                type="submit"
                                                className="w-full h-14 bg-accent hover:bg-accent/90 text-white font-black text-sm rounded-tl-xl rounded-br-xl shadow-lg shadow-accent/20"
                                                disabled={step === 'payment'}
                                            >
                                                {step === 'payment' ? (
                                                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Awaiting Payment...</>
                                                ) : isFree ? (
                                                    <>Enroll for Free <ArrowRight className="h-4 w-4 ml-2" /></>
                                                ) : (
                                                    <><CreditCard className="h-4 w-4 mr-2" /> Pay {priceLabel} via Paystack</>
                                                )}
                                            </Button>

                                            <p className="text-center text-xs text-gray-400">
                                                Already have an account?{' '}
                                                <Link href={`/login?redirect=/e-learning/${slug}/learn`} className="text-primary font-bold hover:underline">
                                                    Log in here
                                                </Link>
                                            </p>
                                        </form>
                                    )}

                                    {/* ── STEP 3: Account creation ── */}
                                    {step === 'account' && (
                                        <form onSubmit={handleAccountCreation} className="space-y-5">
                                            {/* Payment confirmed banner */}
                                            <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl p-4">
                                                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                                                    <CheckCircle className="h-5 w-5 text-green-600" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-green-700 text-sm">Payment Confirmed!</p>
                                                    <p className="text-green-600 text-xs">{isFree ? 'Free enrollment' : `${priceLabel} received`} for {title}</p>
                                                </div>
                                            </div>

                                            <p className="text-sm text-gray-600">
                                                You're enrolling as <strong>{form.email}</strong>. Set a password to create your learner account.
                                            </p>

                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-black uppercase tracking-widest text-primary/50">Create Password</Label>
                                                <div className="relative">
                                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/30" />
                                                    <Input
                                                        required
                                                        type={showPassword ? 'text' : 'password'}
                                                        value={form.password}
                                                        onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                                                        placeholder="At least 6 characters"
                                                        className="pl-11 pr-11 h-14 bg-gray-50 border-gray-200 rounded-tl-xl rounded-br-xl font-medium"
                                                        minLength={6}
                                                    />
                                                    <button type="button" onClick={() => setShowPassword(v => !v)}
                                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary">
                                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-black uppercase tracking-widest text-primary/50">Confirm Password</Label>
                                                <div className="relative">
                                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/30" />
                                                    <Input
                                                        required
                                                        type="password"
                                                        value={form.confirmPassword}
                                                        onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))}
                                                        placeholder="Re-enter your password"
                                                        className="pl-11 h-14 bg-gray-50 border-gray-200 rounded-tl-xl rounded-br-xl font-medium"
                                                    />
                                                </div>
                                            </div>

                                            <Button
                                                type="submit"
                                                className="w-full h-14 bg-primary hover:bg-primary/90 text-white font-black text-sm rounded-tl-xl rounded-br-xl shadow-lg"
                                                disabled={submitting}
                                            >
                                                {submitting
                                                    ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Creating account...</>
                                                    : <>Create Account & Start Learning <ArrowRight className="h-4 w-4 ml-2" /></>
                                                }
                                            </Button>
                                        </form>
                                    )}

                                    {/* ── STEP 4: Success ── */}
                                    {step === 'success' && (
                                        <div className="text-center space-y-6 py-4">
                                            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                                                <CheckCircle className="h-10 w-10 text-green-600" />
                                            </div>
                                            <div className="space-y-2">
                                                <h2 className="text-2xl font-black text-primary">Welcome aboard!</h2>
                                                <p className="text-gray-500 text-sm">Your account has been created and you have full access to <strong>{title}</strong>. Start learning right now!</p>
                                            </div>
                                            <Button
                                                className="w-full h-14 bg-accent hover:bg-accent/90 text-white font-black rounded-tl-xl rounded-br-xl shadow-lg shadow-accent/20"
                                                onClick={() => router.push(`/e-learning/${slug}/learn`)}
                                            >
                                                Start Learning Now <ArrowRight className="h-4 w-4 ml-2" />
                                            </Button>
                                        </div>
                                    )}

                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </main>
        </div>
    );
}
