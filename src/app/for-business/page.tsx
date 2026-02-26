'use client';
import Image from "next/image";
import Link from "next/link";
import { Header } from "@/components/shared/header";
import { Footer } from "@/components/shared/footer";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, ArrowRight, Users, Award, Globe, Building2, ChevronRight, Star, Target, Zap, Shield, BarChart, Loader2, AlertCircle, CheckCircle2, Quote, TrendingDown, TrendingUp, RefreshCcw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useUsersFirestore } from "@/firebase";
import { collection, query, where } from "firebase/firestore";
import { useCollection } from "@/firebase/firestore/use-collection";
import { B2bLeadForm } from '@/components/auth/B2bLeadForm';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PlaceHolderImages } from "@/lib/placeholder-images";

const tiers = [
    {
        name: "Startup",
        tagline: "Perfect for small teams",
        seats: "Up to 5 users",
        maxSeats: 5,
        registrationFee: 25000,
        features: [
            "Up to 5 learner seats",
            "Access to all KSS courses",
            "Business admin portal",
            "Progress tracking & reports",
            "Email support",
            "6-month subscription",
        ],
        highlighted: false,
        color: "border-primary/20",
    },
    {
        name: "SME",
        tagline: "Ideal for growing businesses",
        seats: "Up to 20 users",
        maxSeats: 20,
        registrationFee: 75000,
        features: [
            "Up to 20 learner seats",
            "All Startup features",
            "Dedicated account manager",
            "Custom reporting dashboard",
            "Priority support",
            "12-month subscription",
        ],
        highlighted: true,
        color: "border-accent",
    },
    {
        name: "Corporate",
        tagline: "For large organizations",
        seats: "21+ users",
        maxSeats: null,
        registrationFee: 150000,
        features: [
            "Unlimited learner seats",
            "All SME features",
            "Custom corporate programs",
            "API access & integrations",
            "On-site training options",
            "Dedicated success team",
        ],
        highlighted: false,
        color: "border-primary/20",
    },
];

const benefits = [
    { icon: Target, title: "Targeted Sales Training", description: "Programs designed specifically to build world-class sales teams that close deals and drive revenue." },
    { icon: BarChart, title: "Measurable ROI", description: "Track progress, measure competency growth, and see the direct impact on your business performance." },
    { icon: Users, title: "Team Learning Culture", description: "Foster a culture of continuous learning with shared cohort experiences and team leaderboards." },
    { icon: Shield, title: "Recognized Certification", description: "Your team earns KSS-certified credentials recognized by employers across East Africa." },
    { icon: Zap, title: "Fast Onboarding", description: "Get your entire team enrolled and learning within 24 hours of registration." },
    { icon: Globe, title: "Kenya-Focused Content", description: "Locally relevant curriculum that addresses the unique challenges of the Kenyan market." },
];

const testimonials = [
    { quote: "KSS transformed our sales team. Within 3 months, our conversion rates improved by 40%. The Kenya-specific content was exactly what we needed.", name: "Jane Mwangi", title: "Head of Sales, Nairobi Tech Hub", initials: "JM" },
    { quote: "The business portal makes it incredibly easy to manage our team's learning journey. Real-time insights into progress are invaluable.", name: "Peter Kamau", title: "HR Director, East Africa Group", initials: "PK" },
    { quote: "We enrolled 50 team members and saw a dramatic improvement in both skills and confidence. Best investment we've made in our people.", name: "Sarah Otieno", title: "CEO, Savannah Digital", initials: "SO" },
];

// ── Registration Form (inline, no modal) ──────────────────────────────────────
interface RegFormProps {
    tier: typeof tiers[0];
    onCancel: () => void;
}

import { useUser } from "@/firebase";
import { checkUserExists } from "@/lib/user-checks";

function RegistrationForm({ tier, onCancel }: RegFormProps) {
    const { user: loggedInUser } = useUser();
    const usersFirestore = useUsersFirestore();
    const router = useRouter();

    const [companyName, setCompanyName] = useState('');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [numLearners, setNumLearners] = useState(tier.maxSeats || 1);
    const [agreed, setAgreed] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [checkingEmail, setCheckingEmail] = useState(false);
    const [existingUserFound, setExistingUserFound] = useState(false);

    // Auto-fill form data if user is logged in
    useEffect(() => {
        if (loggedInUser) {
            setName(loggedInUser.name || '');
            setEmail(loggedInUser.email || '');
            setPhone(loggedInUser.phone || '');
            setExistingUserFound(true); // Treat logged-in as existing to block
        }
    }, [loggedInUser]);

    const handleEmailBlur = async () => {
        if (loggedInUser || !email || !usersFirestore) return;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) return;

        setCheckingEmail(true);
        const existing = await checkUserExists(usersFirestore, email);
        setExistingUserFound(!!existing);
        setCheckingEmail(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Prevent submission if user is already logged in or account exists
        if (loggedInUser || existingUserFound) {
            setError('Please use an unregistered email address or log out to create a new Business Account.');
            return;
        }

        if (!agreed) { setError('Please agree to the Terms and Privacy Policy.'); return; }
        if (!companyName || !name || !email) { setError('Please fill in all required fields.'); return; }

        setLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/paystack/initialize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email,
                    amount: tier.registrationFee,
                    reference: `b2b_${Date.now()}`,
                    metadata: {
                        learnerName: name,
                        learnerEmail: email,
                        phone,
                        companyName,
                        tier: tier.name,
                        numLearners,
                        program: `B2B ${tier.name} Plan - ${numLearners} seats`,
                        // After payment, redirect to login page for B2B account setup
                        redirectUrl: `/login?flow=setup_b2b&email=${encodeURIComponent(email)}&name=${encodeURIComponent(name)}&company=${encodeURIComponent(companyName)}&tier=${tier.name}&fee=${tier.registrationFee}&seats=${numLearners}`,
                    }
                }),
            });

            const result = await response.json();
            if (!result.success) throw new Error(result.message || 'Failed to initialize payment');
            window.location.href = result.data.authorization_url;

        } catch (err: any) {
            setError(err.message || 'Failed to initialize payment. Please try again.');
            setLoading(false);
        }
    };

    return (
        <Card className="bg-white border-primary/10 shadow-2xl overflow-hidden rounded-tl-2xl rounded-br-2xl rounded-tr-none rounded-bl-none">
            <CardHeader className="bg-primary text-white p-6 pb-4">
                <div className="flex items-center justify-between mb-2">
                    <Badge className="text-xs font-black uppercase tracking-widest bg-accent text-white rounded-sm">
                        {tier.name} Plan
                    </Badge>
                    <span className="text-white/60 text-xs font-semibold">
                        {tier.maxSeats ? `Up to ${tier.maxSeats} users` : 'Unlimited users'}
                    </span>
                </div>
                <h3 className="font-headline text-2xl font-black text-white">Register Your Organisation</h3>
                <p className="text-white/70 text-sm font-medium">Complete details and pay KES {tier.registrationFee.toLocaleString()} to get started.</p>
            </CardHeader>
            <CardContent className="p-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-primary/60 uppercase tracking-widest">Company Name *</Label>
                        <Input placeholder="Your Company Ltd." value={companyName} onChange={e => setCompanyName(e.target.value)} required disabled={loading} className="h-11 border-primary/20" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold text-primary/60 uppercase tracking-widest">Admin Name *</Label>
                            <Input placeholder="Full Name" value={name} onChange={e => setName(e.target.value)} required disabled={loading || !!loggedInUser} className="h-11 border-primary/20" />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold text-primary/60 uppercase tracking-widest">Phone</Label>
                            <Input type="tel" placeholder="+254 700 000 000" value={phone} onChange={e => setPhone(e.target.value)} disabled={loading} className="h-11 border-primary/20" />
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-primary/60 uppercase tracking-widest">Work Email *</Label>
                        <div className="relative">
                            <Input type="email" placeholder="admin@company.com" value={email} onChange={e => { setEmail(e.target.value); setExistingUserFound(false); }} onBlur={handleEmailBlur} required disabled={loading || !!loggedInUser} className={`h-11 border-primary/20 ${existingUserFound ? 'border-orange-500 focus-visible:ring-orange-500' : ''}`} />
                            {checkingEmail && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-primary/40" />}
                        </div>
                    </div>

                    {(loggedInUser || existingUserFound) && (
                        <div className="flex items-start gap-2 bg-orange-50 border border-orange-200 rounded-lg p-3">
                            <AlertCircle className="h-4 w-4 text-orange-500 flex-shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-orange-700">Account already exists</p>
                                <p className="text-xs text-orange-600 mt-0.5">This email is already registered. To create a new Business Account, please use a different email or log out.</p>
                            </div>
                        </div>
                    )}

                    <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-primary/60 uppercase tracking-widest">Number of Learners *</Label>
                        <Input type="number" min="1" max={tier.maxSeats || 9999} value={numLearners} onChange={e => setNumLearners(parseInt(e.target.value, 10))} required disabled={loading} className="h-11 border-primary/20" />
                        {tier.maxSeats && <p className="text-xs text-primary/50">Max {tier.maxSeats} learners for {tier.name} plan</p>}
                    </div>
                    <div className="flex items-start gap-3">
                        <Checkbox id="b2b-terms" checked={agreed} onCheckedChange={c => setAgreed(c === true)} disabled={loading} />
                        <label htmlFor="b2b-terms" className="text-sm text-primary/70 leading-snug cursor-pointer">
                            I agree to the{' '}<Link href="/terms" className="underline font-semibold" target="_blank">Terms</Link>{' '}and{' '}
                            <Link href="/privacy" className="underline font-semibold" target="_blank">Privacy Policy</Link>
                        </label>
                    </div>
                    {error && <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>}
                    <div className="pt-1 space-y-2">
                        <Button type="submit" className="w-full h-14 bg-accent hover:bg-accent/90 text-white font-black text-base rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none" disabled={loading || !agreed || !!loggedInUser || existingUserFound}>
                            {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Zap className="mr-2 h-5 w-5" />}
                            {loading ? 'Processing...' : `Pay KES ${tier.registrationFee.toLocaleString()} & Continue`}
                        </Button>
                        <Button type="button" variant="ghost" className="w-full h-10 text-primary/60 font-semibold" onClick={onCancel} disabled={loading}>
                            ← Change Plan
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ForBusinessPage() {
    const firestore = useUsersFirestore();
    const settingsRef = firestore ? collection(firestore, 'settings') : null;
    const { data: settings } = useCollection<any>(
        settingsRef ? query(settingsRef, where('__name__', '==', 'branding')) : null
    );
    const branding = settings?.[0];

    const [selectedTier, setSelectedTier] = useState<typeof tiers[0] | null>(null);
    const registrationRef = useRef<HTMLDivElement>(null);

    const handleRegisterClick = (tier: typeof tiers[0]) => {
        setSelectedTier(tier);
        setTimeout(() => {
            registrationRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 50);
    };

    return (
        <div className="flex flex-col min-h-screen bg-white">
            <Header />
            <main className="flex-grow">

                {/* ===== HERO ===== */}
                <section className="relative min-h-screen w-full flex items-end bg-primary overflow-hidden">
                    {branding?.businessHeroUrl && (
                        <Image src={branding.businessHeroUrl} alt="For Business Hero" fill className="object-cover opacity-30" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/95 to-primary/80" />
                    <div className="absolute top-20 right-20 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
                    <div className="absolute bottom-10 left-10 w-64 h-64 bg-secondary/10 rounded-full blur-3xl" />
                    <div className="relative z-10 w-full">
                        <div className="container mx-auto px-4 lg:px-6 py-20 pb-16">
                            <div className="grid lg:grid-cols-2 gap-16 items-center">
                                <div className="max-w-4xl">
                                    <Card className="bg-white border-0 shadow-2xl rounded-tl-3xl rounded-br-3xl rounded-tr-none rounded-bl-none overflow-hidden">
                                        <div className="bg-accent p-6 sm:p-8">
                                            <p className="text-white/80 text-sm font-bold uppercase tracking-widest mb-2">
                                                B2B Corporate Training
                                            </p>
                                            <h1 className="font-headline text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight">
                                                Upskill Your Enterprise.
                                            </h1>
                                        </div>
                                        <div className="p-6 sm:p-8 space-y-4">
                                            <p className="text-base sm:text-lg text-primary/80 leading-relaxed font-medium">
                                                Customised commercial programs designed to dramatically improve revenue performance across your entire team.
                                            </p>
                                            <div className="flex flex-col sm:flex-row gap-4 pt-4">
                                                <Button size="lg" className="rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none h-14 bg-primary text-white hover:bg-primary/90 font-bold px-8 shadow-xl transition-all" onClick={() => handleRegisterClick(tiers[0])}>
                                                    Pricing Plans <ArrowRight className="ml-2 h-5 w-5" />
                                                </Button>
                                                <Button size="lg" variant="outline" className="rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none h-14 border-primary text-primary hover:bg-primary/5 font-bold px-8 transition-all" asChild>
                                                    <Link href="/contact">Talk to Sales</Link>
                                                </Button>
                                            </div>
                                        </div>
                                    </Card>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── STATS BAR ── */}
                <section className="bg-accent">
                    <div className="container mx-auto px-6">
                        <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-white/20">
                            {[
                                { label: "Revenue Growth", value: "40%", subtitle: "Avg. increase" },
                                { label: "Completion Rate", value: "94%", subtitle: "Program success" },
                                { label: "NPS Score", value: "87", subtitle: "Learner satisfaction" },
                                { label: "Time to Impact", value: "4 wks", subtitle: "Measurable results" },
                            ].map((stat, i) => (
                                <div key={i} className="py-8 px-4 sm:px-6 text-center text-white">
                                    <p className="text-3xl sm:text-4xl font-extrabold mb-1">{stat.value}</p>
                                    <p className="text-sm font-bold tracking-wide uppercase mb-1 drop-shadow-sm">{stat.label}</p>
                                    <p className="text-xs text-white/70 font-medium">{stat.subtitle}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── TRUSTED BY (LOGOS / SOCIAL PROOF) ── */}
                <section className="py-12 border-b border-gray-100 bg-white">
                    <div className="container mx-auto px-4 text-center">
                        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-8">Trusted by innovative teams across Africa</p>
                        <div className="flex flex-wrap justify-center items-center gap-8 sm:gap-16 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
                            {/* Generic placeholder icons acting as logos */}
                            <Building2 className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
                            <Target className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
                            <Globe className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
                            <Shield className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
                            <Zap className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
                        </div>
                    </div>
                </section>

                {/* ── SPLIT SECTION 1: THE PROBLEM ── */}
                <section className="py-24 sm:py-32 bg-white overflow-hidden">
                    <div className="container mx-auto px-6">
                        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
                            {/* Copy side */}
                            <div className="w-full lg:w-1/2">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="h-px w-8 bg-accent" />
                                    <span className="text-accent text-sm font-bold uppercase tracking-widest">The High Cost of Inaction</span>
                                </div>
                                <h2 className="font-headline text-4xl sm:text-5xl font-extrabold text-primary leading-tight mb-6">
                                    Untrained Reps Burn Your Market Share.
                                </h2>
                                <p className="text-lg text-gray-600 leading-relaxed mb-8">
                                    A weak commercial engine doesn't just cost you immediate revenue; it erodes brand trust, demotivates top performers, and hands market dominance to your competitors.
                                </p>
                                <div className="space-y-5">
                                    {[
                                        { icon: TrendingDown, title: "Lost Revenue & Missed Quotas", desc: "Reps without a documented sales process rely on luck, leaving millions on the table." },
                                        { icon: RefreshCcw, title: "High Team Turnover", desc: "Burnout hits hardest when reps don't have the skills and frameworks to close consistently." },
                                        { icon: Target, title: "Discounting to Close", desc: "Amateur sellers default to slashing prices instead of building and selling on value." },
                                    ].map((item, i) => (
                                        <div key={i} className="flex items-start gap-4">
                                            <div className="mt-1 bg-red-50 p-2 rounded-tl-lg rounded-br-lg text-red-500 shrink-0">
                                                <item.icon className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-primary text-base mb-0.5">{item.title}</h4>
                                                <p className="text-gray-500 text-sm">{item.desc}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Image side */}
                            <div className="w-full lg:w-1/2 relative">
                                <div className="absolute top-4 -right-4 w-full h-full border-2 border-accent/20 rounded-tl-[3rem] rounded-br-[3rem] rounded-tr-sm rounded-bl-sm z-0" />
                                <div className="relative z-10 aspect-square sm:aspect-[4/3] w-full rounded-tl-[3rem] rounded-br-[3rem] rounded-tr-sm rounded-bl-sm overflow-hidden shadow-2xl">
                                    <Image
                                        src={PlaceHolderImages.find(p => p.id === "event-workshop-calling")?.imageUrl || "https://picsum.photos/800/600"}
                                        alt="Sales team struggling"
                                        fill
                                        className="object-cover"
                                    />
                                    <div className="absolute inset-0 bg-primary/10 mix-blend-multiply" />
                                </div>
                                {/* Floating stat card */}
                                <Card className="absolute -bottom-6 sm:-left-6 p-5 border-0 shadow-2xl bg-white rounded-tl-xl rounded-br-xl rounded-tr-sm rounded-bl-sm z-20 max-w-xs">
                                    <div className="flex items-center gap-4">
                                        <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                                            <TrendingDown className="h-6 w-6 text-red-500" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500 font-medium">Industry Average</p>
                                            <p className="font-black text-primary text-xl">54% Quota Attainment</p>
                                        </div>
                                    </div>
                                </Card>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── SPLIT SECTION 2: THE SOLUTION ── */}
                <section className="py-24 sm:py-32 bg-gray-50 overflow-hidden">
                    <div className="container mx-auto px-6">
                        <div className="flex flex-col lg:flex-row-reverse items-center gap-12 lg:gap-20">
                            {/* Copy side */}
                            <div className="w-full lg:w-1/2">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="h-px w-8 bg-accent" />
                                    <span className="text-accent text-sm font-bold uppercase tracking-widest">The KSS Transformation</span>
                                </div>
                                <h2 className="font-headline text-4xl sm:text-5xl font-extrabold text-primary leading-tight mb-6">
                                    Turn Order Takers Into <span className="text-accent">Trusted Advisors.</span>
                                </h2>
                                <p className="text-lg text-gray-600 leading-relaxed mb-8">
                                    We install robust, predictable commercial capabilities into your organization. From deploying exact prospecting plays to high-level consultative negotiations.
                                </p>
                                <div className="space-y-5">
                                    {[
                                        { icon: Shield, title: "Standardized Frameworks", desc: "A unified sales language across your entire team that scales effortlessly." },
                                        { icon: TrendingUp, title: "Higher Win Rates & ACCV", desc: "Sell deeper into accounts and defend pricing through value articulation." },
                                        { icon: Zap, title: "Rapid Onboarding Ramp", desc: "Cut new-hire ramp time in half. Get reps hitting targets in weeks, not months." },
                                    ].map((item, i) => (
                                        <div key={i} className="flex items-start gap-4">
                                            <div className="mt-1 bg-accent/10 p-2 rounded-tl-lg rounded-br-lg text-accent shrink-0">
                                                <item.icon className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-primary text-base mb-0.5">{item.title}</h4>
                                                <p className="text-gray-500 text-sm">{item.desc}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-10">
                                    <Button size="lg" className="rounded-tl-xl rounded-br-xl bg-primary hover:bg-primary/90 text-white shadow-xl h-14 font-bold px-8 transition-all hover:-translate-y-1" asChild>
                                        <Link href="#pricing">See Corporate Plans <ArrowRight className="ml-2 h-5 w-5" /></Link>
                                    </Button>
                                </div>
                            </div>

                            {/* Image side */}
                            <div className="w-full lg:w-1/2 relative">
                                <div className="absolute top-4 -left-4 w-full h-full border-2 border-primary/20 rounded-tr-[3rem] rounded-bl-[3rem] rounded-tl-sm rounded-br-sm z-0" />
                                <div className="relative z-10 aspect-square sm:aspect-[4/3] w-full rounded-tr-[3rem] rounded-bl-[3rem] rounded-tl-sm rounded-br-sm overflow-hidden shadow-2xl">
                                    <Image
                                        src={PlaceHolderImages.find(p => p.id === "hero-sales-training")?.imageUrl || "https://picsum.photos/800/600"}
                                        alt="High performing sales team"
                                        fill
                                        className="object-cover"
                                    />
                                    <div className="absolute inset-0 bg-accent/5 mix-blend-overlay" />
                                </div>
                                {/* Floating stat card */}
                                <Card className="absolute -bottom-6 sm:-right-6 p-5 border-0 shadow-2xl bg-white rounded-tr-xl rounded-bl-xl rounded-tl-sm rounded-br-sm z-20 max-w-xs">
                                    <div className="flex items-center gap-4">
                                        <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                                            <TrendingUp className="h-6 w-6 text-green-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500 font-medium">KSS Alumni Growth</p>
                                            <p className="font-black text-primary text-xl">+40% Revenue Lift</p>
                                        </div>
                                    </div>
                                </Card>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ===== WHY KSS ===== */}
                <section className="py-20 bg-gray-50/50">
                    <div className="container mx-auto px-4">
                        <div className="text-center mb-16">
                            <Badge className="bg-primary/10 text-primary px-4 py-1.5 text-xs font-black uppercase tracking-widest rounded-tl-md rounded-br-md rounded-tr-none rounded-bl-none mb-4">The KSS Advantage</Badge>
                            <h2 className="font-headline text-3xl sm:text-4xl lg:text-5xl font-bold text-primary mb-4">Everything Your Team Needs to Excel</h2>
                            <p className="text-primary/60 max-w-2xl mx-auto text-lg leading-relaxed">From comprehensive onboarding to advanced sales mastery, KSS provides a complete learning ecosystem tailored specifically for African businesses.</p>
                        </div>
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                            {benefits.map((benefit) => (
                                <Card key={benefit.title} className="bg-white border border-primary/10 shadow-sm rounded-tl-3xl rounded-br-3xl rounded-tr-sm rounded-bl-sm hover:shadow-xl hover:-translate-y-1 hover:border-accent/30 transition-all duration-300 group overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-bl-full -z-10 group-hover:bg-accent/10 transition-colors" />
                                    <div className="p-8">
                                        <div className="h-14 w-14 bg-accent/10 rounded-tl-xl rounded-br-xl rounded-tr-sm rounded-bl-sm flex items-center justify-center mb-6 group-hover:bg-accent group-hover:scale-110 transition-all duration-300 shadow-sm">
                                            <benefit.icon className="h-7 w-7 text-accent group-hover:text-white transition-colors" />
                                        </div>
                                        <h3 className="font-headline font-bold text-primary text-xl mb-3">{benefit.title}</h3>
                                        <p className="text-primary/70 text-sm leading-relaxed">{benefit.description}</p>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ===== PRICING ===== */}
                <section id="pricing" className="py-20 bg-white">
                    <div className="container mx-auto px-4">
                        <div className="text-center mb-16">
                            <Badge className="bg-accent/10 text-accent px-4 py-1.5 text-xs font-black uppercase tracking-widest rounded-tl-md rounded-br-md rounded-tr-none rounded-bl-none mb-4">Pricing Plans</Badge>
                            <h2 className="font-headline text-3xl sm:text-4xl font-bold text-primary mb-4">Choose the Right Plan for Your Team</h2>
                            <p className="text-primary/60 max-w-2xl mx-auto text-lg">Pay a one-time registration fee to get started. Your team gains immediate access to the full KSS learning ecosystem.</p>
                        </div>

                        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto mb-12">
                            {tiers.map((tier) => (
                                <Card key={tier.name} className={`flex flex-col border-2 ${tier.color} ${tier.highlighted ? 'shadow-2xl scale-105 bg-white z-10' : 'shadow-lg bg-white/60 hover:bg-white'} rounded-tl-3xl rounded-br-3xl rounded-tr-sm rounded-bl-sm transition-all hover:shadow-xl relative overflow-hidden ${selectedTier?.name === tier.name ? 'ring-2 ring-accent' : ''}`}>
                                    {tier.highlighted && (
                                        <div className="absolute top-0 w-full bg-accent text-white text-center py-1.5 text-[10px] font-black uppercase tracking-widest shadow-md">Most Popular</div>
                                    )}
                                    <CardHeader className={`text-center pb-4 ${tier.highlighted ? 'pt-10' : 'pt-8'}`}>
                                        <Badge className={`mb-4 inline-flex justify-center mx-auto rounded-sm py-1 px-4 font-black text-xs uppercase tracking-widest ${tier.highlighted ? 'bg-accent text-white' : 'bg-primary/5 text-primary'}`}>{tier.name}</Badge>
                                        <p className="text-sm text-primary/60 font-medium mb-2">{tier.tagline}</p>
                                        <div className="flex items-center justify-center gap-1.5 mb-4">
                                            <Users className="h-4 w-4 text-accent" />
                                            <span className="text-sm font-bold text-primary">{tier.seats}</span>
                                        </div>
                                        <div className="mt-2">
                                            <p className="flex items-start justify-center text-primary">
                                                <span className="text-lg font-bold mt-2 mr-1">KES</span>
                                                <span className="text-5xl font-black">{tier.registrationFee.toLocaleString()}</span>
                                            </p>
                                            <p className="text-[10px] text-primary/40 mt-2 font-black uppercase tracking-widest">One-time registration fee</p>
                                        </div>
                                    </CardHeader>
                                    <div className="px-6 pb-6 mt-4">
                                        <ul className="space-y-4 mb-8">
                                            {tier.features.map((feature) => (
                                                <li key={feature} className="flex items-start gap-3 text-sm">
                                                    <div className="h-5 w-5 bg-accent/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                                        <Check className="h-3 w-3 text-accent" />
                                                    </div>
                                                    <span className="text-primary/70 font-medium">{feature}</span>
                                                </li>
                                            ))}
                                        </ul>
                                        <Button
                                            onClick={() => handleRegisterClick(tier)}
                                            className={`w-full rounded-tl-xl rounded-br-xl rounded-tr-sm rounded-bl-sm font-bold h-14 shadow-lg ${tier.highlighted ? 'bg-accent hover:bg-accent/90 text-white hover:-translate-y-1' : 'bg-primary hover:bg-primary/90 text-white hover:-translate-y-1'} transition-all duration-300`}
                                        >
                                            Register Your Team
                                            <ArrowRight className="ml-2 h-4 w-4" />
                                        </Button>
                                    </div>
                                </Card>
                            ))}
                        </div>

                        {/* Inline Registration Form */}
                        {selectedTier && (
                            <div ref={registrationRef} className="max-w-2xl mx-auto mt-8 scroll-mt-24">
                                <div className="text-center mb-8">
                                    <Badge className="bg-accent/10 text-accent px-4 py-1.5 text-xs font-black uppercase tracking-widest rounded-tl-md rounded-br-md rounded-tr-none rounded-bl-none mb-4">
                                        Registration
                                    </Badge>
                                    <h2 className="font-headline text-2xl sm:text-3xl font-bold text-primary">
                                        Register for <span className="text-accent">{selectedTier.name}</span> Plan
                                    </h2>
                                    <p className="text-primary/60 mt-2">KES {selectedTier.registrationFee.toLocaleString()} one-time registration fee</p>
                                </div>
                                <RegistrationForm tier={selectedTier} onCancel={() => setSelectedTier(null)} />
                            </div>
                        )}
                    </div>
                </section>

                {/* ===== TESTIMONIALS ===== */}
                <section className="py-20 bg-gray-50/50">
                    <div className="container mx-auto px-4">
                        <div className="text-center mb-16">
                            <Badge className="bg-primary/10 text-primary px-4 py-1.5 text-xs font-black uppercase tracking-widest rounded-tl-md rounded-br-md rounded-tr-none rounded-bl-none mb-4">Client Stories</Badge>
                            <h2 className="font-headline text-3xl sm:text-4xl font-bold text-primary">Trusted by Leading Organizations</h2>
                        </div>
                        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
                            {testimonials.map((t, i) => (
                                <div key={i} className="bg-white border border-primary/10 rounded-tl-3xl rounded-br-3xl rounded-tr-sm rounded-bl-sm p-8 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative">
                                    <Quote className="absolute top-6 right-6 h-12 w-12 text-primary/5 rotate-180" />
                                    <div className="flex gap-1 mb-6">
                                        {[...Array(5)].map((_, j) => <Star key={j} className="h-4 w-4 fill-accent text-accent" />)}
                                    </div>
                                    <p className="text-primary/80 text-base leading-relaxed mb-8 italic relative z-10">"{t.quote}"</p>
                                    <div className="flex items-center gap-4 border-t border-primary/5 pt-6 mt-auto">
                                        <div className="h-12 w-12 bg-primary rounded-tl-xl rounded-br-xl rounded-tr-sm rounded-bl-sm flex items-center justify-center text-white text-sm font-black shadow-md">{t.initials}</div>
                                        <div>
                                            <p className="font-bold text-primary">{t.name}</p>
                                            <p className="text-xs font-semibold text-primary/50 tracking-wider uppercase">{t.title}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ===== ENQUIRE ===== */}
                <section id="enquire" className="py-20 bg-primary relative overflow-hidden">
                    <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
                    <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-64 h-64 bg-secondary/10 rounded-full blur-3xl" />
                    <div className="container mx-auto px-4 relative z-10">
                        <div className="grid lg:grid-cols-2 gap-16 items-center max-w-6xl mx-auto">
                            <div className="text-white">
                                <Badge className="bg-accent text-white border-none px-4 py-1.5 text-xs font-black uppercase tracking-widest rounded-tl-md rounded-br-md rounded-tr-none rounded-bl-none mb-6 inline-flex">Get In Touch</Badge>
                                <h2 className="font-headline text-3xl sm:text-4xl lg:text-5xl font-bold mb-6 leading-tight">
                                    Not Ready to Commit?
                                    <span className="block text-accent">Just Show Interest.</span>
                                </h2>
                                <p className="text-white/70 text-lg leading-relaxed mb-8 max-w-lg">
                                    Let us know you're interested and our team will reach out to understand your needs, share more details, and guide you to the right plan.
                                </p>
                                <div className="space-y-4">
                                    {["No commitment required", "Personalized consultation", "Tailored program recommendations", "Flexible payment options"].map(item => (
                                        <div key={item} className="flex items-center gap-3">
                                            <div className="h-6 w-6 bg-accent/20 rounded-full flex items-center justify-center flex-shrink-0">
                                                <Check className="h-3 w-3 text-accent" />
                                            </div>
                                            <span className="text-white/90 text-base font-medium">{item}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="bg-white rounded-tl-3xl rounded-br-3xl rounded-tr-sm rounded-bl-sm shadow-2xl p-2 relative lg:translate-y-12">
                                <B2bLeadForm />
                            </div>
                        </div>
                    </div>
                </section>

            </main>
            <Footer />
        </div>
    );
}
