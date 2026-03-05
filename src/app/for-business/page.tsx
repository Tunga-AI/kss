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
        name: "Diagnostics",
        tagline: "Identify the real drivers of commercial performance",
        seats: "Per engagement",
        maxSeats: null,
        registrationFee: 150000,
        features: [
            "Leadership interviews",
            "Team sales assessments",
            "Commercial data review",
            "Structured gap analysis",
            "Clear recommendations report",
            "1–2 day engagement",
        ],
        highlighted: false,
        color: "border-primary/20",
    },
    {
        name: "Sales Playbook",
        tagline: "Codify how your business wins in the market",
        seats: "Per engagement",
        maxSeats: null,
        registrationFee: 250000,
        features: [
            "Sales process & pipeline design",
            "Customer segmentation framework",
            "Value articulation & positioning",
            "Prospecting & opportunity discipline",
            "Standardized tools & templates",
            "Repeatable 'Way of Selling'",
        ],
        highlighted: true,
        color: "border-accent",
    },
    {
        name: "Capability Academy",
        tagline: "Build disciplined, high-performing sales teams",
        seats: "Per cohort",
        maxSeats: null,
        registrationFee: 350000,
        features: [
            "Structured learning blocks",
            "Real-world sales simulations",
            "Applied field assignments",
            "Four Quadrant Capability Framework",
            "Frontline & leadership tracks",
            "Measurable capability outcomes",
        ],
        highlighted: false,
        color: "border-primary/20",
    },
];

const benefits = [
    { icon: Target, title: "Diagnostics", description: "A structured assessment of your sales execution system — surfacing structural gaps that affect revenue performance." },
    { icon: BarChart, title: "Sales Playbooks", description: "Translate strategy into practical execution standards that guide how sales teams operate in the field." },
    { icon: Users, title: "Capability Academies", description: "Develop core selling skills, commercial thinking and execution discipline for consistent revenue performance." },
    { icon: Zap, title: "Commercial Execution Lab", description: "A facilitated working session for leadership teams to address complex, systemic execution challenges." },
    { icon: Shield, title: "Recognized Frameworks", description: "All programs are aligned to the ISP Sales Capability Framework — globally benchmarked and locally grounded." },
    { icon: Globe, title: "African Commercial Context", description: "Curriculum grounded in African commercial realities and developed within the Commercial Club of Africa ecosystem." },
];

const testimonials = [
    { quote: "The diagnostic surfaced execution gaps we weren't aware of. The recommendations were clear, practical and immediately actionable.", name: "Head of Commercial, Financial Services", title: "East Africa", initials: "HC" },
    { quote: "The sales playbook gave our team a shared language and process. Opportunity conversion improved noticeably within two quarters.", name: "Sales Director, FMCG", title: "Kenya", initials: "SD" },
    { quote: "The Capability Academy was a turning point. Our managers now coach with structure and our reps execute with far more discipline.", name: "CEO, Professional Services Firm", title: "Nairobi", initials: "CE" },
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
                                                Corporate Capability Solutions
                                            </p>
                                            <h1 className="font-headline text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight">
                                                Helping Organizations Strengthen Commercial Execution.
                                            </h1>
                                        </div>
                                        <div className="p-6 sm:p-8 space-y-4">
                                            <p className="text-base sm:text-lg text-primary/80 leading-relaxed font-medium">
                                                We partner with organizations to diagnose commercial challenges, define execution frameworks and develop high-performing sales teams.
                                            </p>
                                            <div className="flex flex-col sm:flex-row gap-4 pt-4">
                                                <Button size="lg" className="rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none h-14 bg-primary text-white hover:bg-primary/90 font-bold px-8 shadow-xl transition-all" onClick={() => handleRegisterClick(tiers[0])}>
                                                    Our Solutions <ArrowRight className="ml-2 h-5 w-5" />
                                                </Button>
                                                <Button size="lg" variant="outline" className="rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none h-14 border-primary text-primary hover:bg-primary/5 font-bold px-8 transition-all" asChild>
                                                    <Link href="/contact">Book a Discovery Call</Link>
                                                </Button>
                                            </div>
                                        </div>
                                    </Card>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>


                {/* ── DIAGNOSTICS ── */}
                <section className="py-24 sm:py-32 bg-white overflow-hidden">
                    <div className="container mx-auto px-6">
                        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
                            <div className="w-full lg:w-1/2">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="h-px w-8 bg-accent" />
                                    <span className="text-accent text-sm font-bold uppercase tracking-widest">Diagnostics</span>
                                </div>
                                <h2 className="font-headline text-4xl sm:text-5xl font-extrabold text-primary leading-tight mb-6">
                                    Identify the Real Drivers of Commercial Performance.
                                </h2>
                                <p className="text-lg text-gray-600 leading-relaxed mb-6">
                                    Our diagnostics provide a structured assessment of your sales execution system — including pipeline discipline, leadership capability, sales process clarity, and field execution habits.
                                </p>
                                <p className="text-lg text-gray-600 leading-relaxed mb-8">
                                    Through leadership interviews, team assessments and commercial data review, we surface the structural gaps that affect revenue performance and present a clear set of recommendations for improvement.
                                </p>
                                <div className="space-y-4 mb-8">
                                    {[
                                        { icon: Target, text: "Pipeline discipline & opportunity management" },
                                        { icon: Users, text: "Leadership capability assessment" },
                                        { icon: BarChart, text: "Sales process clarity & field execution habits" },
                                    ].map((item, i) => (
                                        <div key={i} className="flex items-center gap-4">
                                            <div className="mt-1 bg-accent/10 p-2 rounded-tl-lg rounded-br-lg text-accent shrink-0">
                                                <item.icon className="h-5 w-5" />
                                            </div>
                                            <p className="text-gray-700 font-medium">{item.text}</p>
                                        </div>
                                    ))}
                                </div>
                                <div className="bg-gray-50 border border-gray-100 rounded-tl-2xl rounded-br-2xl p-5">
                                    <p className="text-sm text-gray-500">Conducted over <strong className="text-primary">1–2 days</strong> and forms the foundation for any capability intervention. Engagements start from <strong className="text-primary">KSh 150,000 per day</strong>.</p>
                                </div>
                            </div>
                            <div className="w-full lg:w-1/2 relative">
                                <div className="absolute top-4 -right-4 w-full h-full border-2 border-accent/20 rounded-tl-[3rem] rounded-br-[3rem] rounded-tr-sm rounded-bl-sm z-0" />
                                <div className="relative z-10 aspect-square sm:aspect-[4/3] w-full rounded-tl-[3rem] rounded-br-[3rem] rounded-tr-sm rounded-bl-sm overflow-hidden shadow-2xl">
                                    <Image
                                        src={PlaceHolderImages.find(p => p.id === "event-workshop-calling")?.imageUrl || "https://picsum.photos/800/600"}
                                        alt="Commercial diagnostics session"
                                        fill
                                        className="object-cover"
                                    />
                                    <div className="absolute inset-0 bg-primary/10 mix-blend-multiply" />
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── SALES PLAYBOOK ── */}
                <section className="py-24 sm:py-32 bg-gray-50 overflow-hidden">
                    <div className="container mx-auto px-6">
                        <div className="flex flex-col lg:flex-row-reverse items-center gap-12 lg:gap-20">
                            <div className="w-full lg:w-1/2">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="h-px w-8 bg-accent" />
                                    <span className="text-accent text-sm font-bold uppercase tracking-widest">Sales Playbooks</span>
                                </div>
                                <h2 className="font-headline text-4xl sm:text-5xl font-extrabold text-primary leading-tight mb-6">
                                    Codify How Your Business <span className="text-accent">Wins in the Market.</span>
                                </h2>
                                <p className="text-lg text-gray-600 leading-relaxed mb-4">
                                    A Sales Playbook translates strategy into practical execution standards that guide how sales teams engage prospects, manage opportunities and drive revenue outcomes.
                                </p>
                                <p className="text-sm font-semibold text-primary mb-3 uppercase tracking-wider">Playbooks typically define:</p>
                                <div className="space-y-3 mb-8">
                                    {[
                                        "Your organization's sales process and pipeline stages",
                                        "Customer segmentation and account prioritization",
                                        "Value articulation and positioning frameworks",
                                        "Prospecting and opportunity development discipline",
                                        "Standardized tools, templates and field routines",
                                    ].map((item, i) => (
                                        <div key={i} className="flex items-start gap-3">
                                            <div className="h-5 w-5 bg-accent/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                                <Check className="h-3 w-3 text-accent" />
                                            </div>
                                            <span className="text-gray-700 text-sm">{item}</span>
                                        </div>
                                    ))}
                                </div>
                                <blockquote className="border-l-4 border-accent pl-5 italic text-gray-500 text-sm mb-8">
                                    "Many businesses invest in sales training without first defining how they expect their teams to sell. The playbook ensures capability development is aligned to a clear commercial operating model."
                                </blockquote>
                                <Button size="lg" className="rounded-tl-xl rounded-br-xl bg-primary hover:bg-primary/90 text-white shadow-xl h-14 font-bold px-8 transition-all hover:-translate-y-1" asChild>
                                    <Link href="#pricing">View Engagement Options <ArrowRight className="ml-2 h-5 w-5" /></Link>
                                </Button>
                            </div>
                            <div className="w-full lg:w-1/2 relative">
                                <div className="absolute top-4 -left-4 w-full h-full border-2 border-primary/20 rounded-tr-[3rem] rounded-bl-[3rem] rounded-tl-sm rounded-br-sm z-0" />
                                <div className="relative z-10 aspect-square sm:aspect-[4/3] w-full rounded-tr-[3rem] rounded-bl-[3rem] rounded-tl-sm rounded-br-sm overflow-hidden shadow-2xl">
                                    <Image
                                        src={PlaceHolderImages.find(p => p.id === "hero-sales-training")?.imageUrl || "https://picsum.photos/800/600"}
                                        alt="Sales playbook session"
                                        fill
                                        className="object-cover"
                                    />
                                    <div className="absolute inset-0 bg-accent/5 mix-blend-overlay" />
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ===== CAPABILITY ACADEMIES + EXECUTION LAB ===== */}
                <section className="py-20 bg-white">
                    <div className="container mx-auto px-4">
                        <div className="grid lg:grid-cols-2 gap-12">
                            {/* Capability Academies */}
                            <div className="bg-gray-50 rounded-tl-3xl rounded-br-3xl p-10">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="h-px w-8 bg-accent" />
                                    <span className="text-accent text-sm font-bold uppercase tracking-widest">Capability Academies</span>
                                </div>
                                <h3 className="font-headline text-3xl font-extrabold text-primary mb-4">Build Disciplined, High-Performing Sales Teams.</h3>
                                <p className="text-gray-600 leading-relaxed mb-6">
                                    Our Capability Academies develop the core skills, commercial thinking and execution discipline required for consistent revenue performance. Programs are delivered through structured learning blocks, real-world sales simulations and applied field assignments.
                                </p>
                                <p className="text-sm font-semibold text-primary mb-3 uppercase tracking-wider">Academies are designed for:</p>
                                <div className="space-y-2 mb-6">
                                    {["Frontline sales teams", "Account managers and enterprise sellers", "Sales managers and commercial leaders"].map((item, i) => (
                                        <div key={i} className="flex items-center gap-3">
                                            <div className="h-5 w-5 bg-accent/10 rounded-full flex items-center justify-center flex-shrink-0">
                                                <Check className="h-3 w-3 text-accent" />
                                            </div>
                                            <span className="text-gray-700 text-sm">{item}</span>
                                        </div>
                                    ))}
                                </div>
                                <p className="text-sm text-gray-500">Each academy is aligned to our <strong className="text-primary">Four Quadrant Capability Framework</strong> covering core selling skills, commercial acumen, leadership discipline and professional mindset.</p>
                            </div>
                            {/* Commercial Execution Lab */}
                            <div className="bg-primary rounded-tl-3xl rounded-br-3xl p-10 text-white">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="h-px w-8 bg-accent" />
                                    <span className="text-accent text-sm font-bold uppercase tracking-widest">Commercial Execution Lab</span>
                                </div>
                                <h3 className="font-headline text-3xl font-extrabold text-white mb-4">Solve Systemic Commercial Challenges.</h3>
                                <p className="text-white/80 leading-relaxed mb-6">
                                    Most revenue challenges stem from structural issues rather than individual skill gaps. The Commercial Execution Lab is a facilitated working session designed for leadership teams to address complex execution challenges.
                                </p>
                                <p className="text-sm font-semibold text-accent mb-3 uppercase tracking-wider">Sessions address:</p>
                                <div className="space-y-2 mb-6">
                                    {[
                                        "Market segmentation and account prioritization",
                                        "Pipeline structure and forecasting discipline",
                                        "Sales role clarity and performance expectations",
                                        "Cross-functional commercial alignment",
                                    ].map((item, i) => (
                                        <div key={i} className="flex items-center gap-3">
                                            <div className="h-5 w-5 bg-accent/20 rounded-full flex items-center justify-center flex-shrink-0">
                                                <Check className="h-3 w-3 text-accent" />
                                            </div>
                                            <span className="text-white/90 text-sm">{item}</span>
                                        </div>
                                    ))}
                                </div>
                                <p className="text-white/60 text-sm">This session produces practical outputs that leadership teams can immediately operationalize.</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ===== CORPORATE CASE STUDIES ===== */}
                <section className="py-20 bg-gray-50/50">
                    <div className="container mx-auto px-4">
                        <div className="text-center mb-16">
                            <Badge className="bg-primary/10 text-primary px-4 py-1.5 text-xs font-black uppercase tracking-widest rounded-tl-md rounded-br-md rounded-tr-none rounded-bl-none mb-4">Corporate Case Studies</Badge>
                            <h2 className="font-headline text-3xl sm:text-4xl font-bold text-primary mb-4">See How Businesses Strengthen Commercial Performance.</h2>
                            <p className="text-primary/60 max-w-2xl mx-auto text-lg leading-relaxed">We work with businesses across sectors including financial services, FMCG, technology, professional services and real estate to strengthen commercial execution and sales capability.</p>
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
                    <div className="container mx-auto px-6">
                        <div className="text-center mb-16">
                            <Badge className="bg-accent/10 text-accent px-4 py-1.5 text-xs font-black uppercase tracking-widest rounded-tl-md rounded-br-md rounded-tr-none rounded-bl-none mb-4">Engagement Options</Badge>
                            <h2 className="font-headline text-3xl sm:text-4xl font-bold text-primary mb-4">Choose the Right Engagement for Your Organization</h2>
                            <p className="text-primary/60 max-w-2xl mx-auto text-lg">All engagements begin with a discovery call to scope requirements and confirm the right intervention for your commercial context.</p>
                        </div>

                        <div className="grid md:grid-cols-3 gap-8 mb-12">
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
                                    <div className="px-8 pb-8 mt-4">
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
                                            Book a Discovery Call
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
                                    Ready to Explore
                                    <span className="block text-accent">a Partnership?</span>
                                </h2>
                                <p className="text-white/70 text-lg leading-relaxed mb-8 max-w-lg">
                                    Schedule a discovery call and our team will scope your commercial context, outline available interventions and recommend the right starting point.
                                </p>
                                <div className="space-y-4">
                                    {["No commitment required", "Tailored engagement scoping", "Aligned to your commercial context", "Flexible engagement structures"].map(item => (
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
