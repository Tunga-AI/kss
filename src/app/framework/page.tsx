'use client';
import Image from "next/image";
import Link from "next/link";
import { Header } from "@/components/shared/header";
import { Footer } from "@/components/shared/footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { useUsersFirestore } from "@/firebase";
import { collection, query, where } from "firebase/firestore";
import { useCollection } from "@/firebase/firestore/use-collection";
import {
    ArrowRight, TrendingUp, Cpu, Brain, Shield,
    Users, Group, Lightbulb, Target, Briefcase,
    Handshake, CheckCircle
} from "lucide-react";

/* ── Static Data ── */
const pillars = [
    {
        icon: Target,
        number: "01",
        title: "The Art of Selling",
        description: "Master the core skills that turn every conversation into a closed deal — prospecting, pitching, objection handling, and negotiation.",
        detail: "From your first cold call to your most complex enterprise deal, this pillar gives you the battle-tested techniques that elite sellers use every single day."
    },
    {
        icon: Briefcase,
        number: "02",
        title: "Business Savvy",
        description: "Understand how businesses work and learn to speak your clients' language — from P&L to procurement.",
        detail: "Top performers don't just sell products. They understand the business challenges their clients face and position their solution as the strategic answer."
    },
    {
        icon: Handshake,
        number: "03",
        title: "People Power",
        description: "Build lasting influence, communicate with authority, and create the relationships that fuel long-term success.",
        detail: "Sales is ultimately a human endeavour. This pillar builds your emotional intelligence, presence, and ability to lead conversations at every level of an organisation."
    },
    {
        icon: Brain,
        number: "04",
        title: "Personal Excellence",
        description: "Develop the mindset, discipline, and resilience that separate average performers from the top 1%.",
        detail: "Quota misses, rejection, and setbacks are part of the game. This pillar ensures you bounce back faster, maintain focus, and stay ambitious regardless of conditions."
    },
];

const levels = [
    {
        level: 1,
        title: "Getting Started",
        tag: "Foundations",
        colour: "bg-accent",
        description: "Build confidence and master the fundamentals every successful salesperson needs. Ideal for those new to a commercial role or self-taught sellers looking to formalise their skills.",
        outcomes: ["Understand the sales process end-to-end", "Make your first outbound calls confidently", "Handle basic objections professionally"],
    },
    {
        level: 2,
        title: "Hitting Your Stride",
        tag: "Skilled Practitioner",
        colour: "bg-primary",
        description: "Sharpen your technique, learn to sell value over price, and build pipelines that consistently exceed targets quarter after quarter.",
        outcomes: ["Master value-based selling", "Build and manage a healthy pipeline", "Close complex deals reliably"],
    },
    {
        level: 3,
        title: "Leading Others",
        tag: "Team Leader",
        colour: "bg-accent",
        description: "Step into leadership. Learn strategic selling, key account management, and how to coach a team to over-performance.",
        outcomes: ["Manage key accounts strategically", "Coach and motivate a sales team", "Build repeatable sales playbooks"],
    },
    {
        level: 4,
        title: "The Big Picture",
        tag: "Sales Director",
        colour: "bg-primary",
        description: "Shape commercial strategy, manage multiple regions, and influence C-suite stakeholders in complex organisational environments.",
        outcomes: ["Design regional go-to-market strategies", "Influence executive decision-making", "Drive large-scale revenue transformation"],
    },
    {
        level: 5,
        title: "Sales Visionary",
        tag: "C-Suite Commercial Leader",
        colour: "bg-accent",
        description: "Design innovative commercial systems, lead enterprise-wide transformation, and build the sales infrastructures that scale organisations.",
        outcomes: ["Build scalable commercial architectures", "Lead digital and strategic transformation", "Create lasting market competitive advantage"],
    },
];

const methods = [
    {
        icon: Group,
        title: "Learn With Your Peers",
        description: "Our cohort model means you're never learning in isolation. Work through real-world sales challenges alongside people who understand what you're facing every day. The relationships you build here last a career."
    },
    {
        icon: Users,
        title: "Learn from Active Practitioners",
        description: "Every facilitator at KSS is an active sales leader—not a career academic. They bring current market intel, live case studies, and the kind of hard-won insight that only comes from actually doing."
    },
    {
        icon: Lightbulb,
        title: "Learn Your Way",
        description: "Life is busy. We offer in-person workshops for depth and connection, live online sessions for flexibility, and self-paced digital content for whenever you have 20 minutes to sharpen your edge."
    },
];

/* ── Component ── */
export default function FrameworkPage() {
    const heroImage = PlaceHolderImages.find(p => p.id === 'framework-hero');
    const successImage = PlaceHolderImages.find(p => p.id === 'success-hero');

    const firestore = useUsersFirestore();
    const settingsRef = firestore ? collection(firestore, 'settings') : null;
    const { data: settings } = useCollection<any>(
        settingsRef ? query(settingsRef, where('__name__', '==', 'branding')) : null
    );
    const branding = settings?.[0];

    return (
        <div className="flex flex-col min-h-screen bg-white">
            <Header />
            <main className="flex-grow">

                {/* ── HERO ── */}
                <section className="relative min-h-screen w-full flex items-end bg-primary overflow-hidden">
                    {branding?.frameworkHeroUrl && (
                        <Image
                            src={branding.frameworkHeroUrl}
                            alt="KSS Framework"
                            fill
                            className="object-cover"
                            priority
                            sizes="100vw"
                        />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/50 to-transparent" />
                    <div className="relative z-10 w-full">
                        <div className="container mx-auto px-4 lg:px-6 py-20 pb-16">
                            <div className="max-w-4xl">
                                <Card className="bg-white border-0 shadow-2xl rounded-tl-3xl rounded-br-3xl rounded-tr-none rounded-bl-none overflow-hidden">
                                    <div className="bg-accent p-6 sm:p-8">
                                        <p className="text-white/80 text-sm font-bold uppercase tracking-widest mb-2">The KSS Framework</p>
                                        <h1 className="font-headline text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight">
                                            Your Roadmap to Sales Mastery.
                                        </h1>
                                    </div>
                                    <div className="p-6 sm:p-8 space-y-4">
                                        <p className="text-base sm:text-lg text-primary/80 leading-relaxed">
                                            A structured career pathway — from first sale to sales visionary — built on internationally recognised standards.
                                        </p>
                                        <Button size="lg" className="rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none bg-primary hover:bg-primary/90 text-white shadow-md transition-all" asChild>
                                            <Link href="/courses">Explore Courses <ArrowRight className="ml-2 h-5 w-5" /></Link>
                                        </Button>
                                    </div>
                                </Card>
                            </div>
                        </div>
                    </div>
                </section>


                {/* ── FRAMEWORK INTRO ── */}
                <section className="py-24 bg-white">
                    <div className="container mx-auto px-6">
                        <div className="grid lg:grid-cols-2 gap-16 items-center">
                            <div>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="h-px w-8 bg-accent" />
                                    <span className="text-accent text-sm font-bold uppercase tracking-widest">Framework Overview</span>
                                </div>
                                <h2 className="font-headline text-4xl sm:text-5xl font-extrabold text-primary leading-tight mb-6">
                                    Your Career GPS.
                                </h2>
                                <p className="text-gray-600 text-lg leading-relaxed mb-5">
                                    The KSS Sales Capability Framework is the backbone of everything we teach. It's a structured, progressive system that maps out exactly what skills, knowledge, and behaviours you need at each stage of your commercial career.
                                </p>
                                <p className="text-gray-600 text-lg leading-relaxed mb-8">
                                    Whether you're starting out or already leading a team, the framework shows you where you are, where you're going, and the most efficient path to get there.
                                </p>
                                <div className="grid grid-cols-2 gap-6">
                                    {[
                                        { icon: TrendingUp, label: "5 Progressive Levels", desc: "From day-one seller to sales visionary" },
                                        { icon: Cpu, label: "Real-World Application", desc: "Every lesson is immediately deployable" },
                                        { icon: Brain, label: "Competency-Based", desc: "Skills that prove themselves on results" },
                                        { icon: Shield, label: "Globally Benchmarked", desc: "Aligned to UK ISP standards" },
                                    ].map((item, i) => (
                                        <div key={i} className="bg-gray-50 rounded-tl-2xl rounded-br-2xl p-5 border border-gray-100">
                                            <div className="w-10 h-10 bg-primary/10 text-primary rounded-tl-lg rounded-br-lg flex items-center justify-center mb-3">
                                                <item.icon className="h-5 w-5" />
                                            </div>
                                            <p className="font-bold text-primary text-sm mb-1">{item.label}</p>
                                            <p className="text-gray-500 text-xs">{item.desc}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Image */}
                            <div className="relative">
                                <div className="relative h-[500px] rounded-tl-[3rem] rounded-br-[3rem] overflow-hidden shadow-2xl">
                                    {successImage && (
                                        <Image
                                            src={successImage.imageUrl}
                                            alt="Sales Success"
                                            fill
                                            className="object-cover"
                                            sizes="(max-width: 1024px) 100vw, 50vw"
                                        />
                                    )}
                                    <div className="absolute inset-0 bg-primary/20 mix-blend-multiply" />
                                </div>
                                <div className="absolute -bottom-6 -left-4 md:-left-8 bg-accent text-white p-6 rounded-tl-2xl rounded-br-2xl shadow-2xl">
                                    <p className="text-4xl font-extrabold mb-1">ISP</p>
                                    <p className="text-sm font-medium text-white/80 uppercase">UK Institute of<br />Sales Professionals</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── FOUR PILLARS ── */}
                <section className="py-24 bg-primary">
                    <div className="container mx-auto px-6">
                        <div className="text-center text-white mb-16">
                            <div className="flex items-center justify-center gap-3 mb-4">
                                <div className="h-px w-8 bg-accent" />
                                <span className="text-accent text-sm font-bold uppercase tracking-widest">Four Pillars</span>
                                <div className="h-px w-8 bg-accent" />
                            </div>
                            <h2 className="font-headline text-4xl sm:text-5xl font-extrabold mb-4">The Four Pillars of Excellence</h2>
                            <p className="text-white/60 text-lg max-w-2xl mx-auto">
                                Sales success isn't built on one skill. It is built on the mastery of four interconnected dimensions — each reinforcing the others.
                            </p>
                        </div>
                        <div className="grid md:grid-cols-2 gap-8">
                            {pillars.map((p, i) => (
                                <div key={i} className="bg-white/5 border border-white/10 rounded-tl-3xl rounded-br-3xl p-8 hover:bg-white/10 transition-colors group">
                                    <div className="flex items-start gap-6">
                                        <div className="shrink-0">
                                            <span className="block text-5xl font-extrabold text-white/10 font-headline leading-none mb-2">{p.number}</span>
                                            <div className="w-14 h-14 bg-accent/20 text-accent rounded-tl-xl rounded-br-xl flex items-center justify-center group-hover:bg-accent group-hover:text-white transition-colors">
                                                <p.icon className="h-7 w-7" />
                                            </div>
                                        </div>
                                        <div>
                                            <h3 className="font-headline font-bold text-white text-xl mb-3">{p.title}</h3>
                                            <p className="text-white/70 leading-relaxed mb-4">{p.description}</p>
                                            <p className="text-white/50 text-sm leading-relaxed italic">{p.detail}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── CAREER LEVELS (Timeline) ── */}
                <section className="py-24 bg-gray-50">
                    <div className="container mx-auto px-6">
                        <div className="text-center mb-16">
                            <div className="flex items-center justify-center gap-3 mb-4">
                                <div className="h-px w-8 bg-accent" />
                                <span className="text-accent text-sm font-bold uppercase tracking-widest">Career Levels</span>
                                <div className="h-px w-8 bg-accent" />
                            </div>
                            <h2 className="font-headline text-4xl sm:text-5xl font-extrabold text-primary mb-4">From Newbie to Sales Visionary.</h2>
                            <p className="text-gray-500 text-lg max-w-2xl mx-auto">
                                Each level is a complete certification in its own right. Progress at your own pace, or fast-track if your experience warrants it.
                            </p>
                        </div>

                        <div className="max-w-4xl mx-auto space-y-6">
                            {levels.map((level, i) => (
                                <div key={i} className="bg-white rounded-tl-3xl rounded-br-3xl border border-gray-100 shadow-sm hover:shadow-lg transition-all overflow-hidden group">
                                    <div className="flex items-stretch">
                                        {/* Level number block */}
                                        <div className={`${level.colour} text-white w-24 sm:w-32 shrink-0 flex flex-col items-center justify-center p-6`}>
                                            <span className="text-sm font-bold uppercase tracking-widest opacity-70 mb-1">Level</span>
                                            <span className="text-5xl font-extrabold font-headline leading-none">{level.level}</span>
                                        </div>
                                        {/* Content */}
                                        <div className="p-6 sm:p-8 flex-grow">
                                            <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                                                <h3 className="font-headline font-bold text-2xl text-primary">{level.title}</h3>
                                                <span className={`${level.colour} text-white text-xs font-bold px-3 py-1.5 rounded-full`}>{level.tag}</span>
                                            </div>
                                            <p className="text-gray-500 leading-relaxed mb-5">{level.description}</p>
                                            <ul className="space-y-2">
                                                {level.outcomes.map((o, j) => (
                                                    <li key={j} className="flex items-center gap-2.5 text-sm text-gray-600">
                                                        <CheckCircle className="h-4 w-4 text-accent shrink-0" />
                                                        {o}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="text-center mt-14">
                            <Button size="lg" className="rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none bg-primary hover:bg-primary/90 text-white h-14 px-10 font-bold shadow-lg" asChild>
                                <Link href="/courses">Begin Your Journey <ArrowRight className="ml-2 h-5 w-5" /></Link>
                            </Button>
                        </div>
                    </div>
                </section>

                {/* ── LEARNING METHOD ── */}
                <section className="py-24 bg-white">
                    <div className="container mx-auto px-6">
                        <div className="text-center mb-16">
                            <div className="flex items-center justify-center gap-3 mb-4">
                                <div className="h-px w-8 bg-accent" />
                                <span className="text-accent text-sm font-bold uppercase tracking-widest">Our Method</span>
                                <div className="h-px w-8 bg-accent" />
                            </div>
                            <h2 className="font-headline text-4xl sm:text-5xl font-extrabold text-primary mb-4">How We Make Learning Stick.</h2>
                            <p className="text-gray-500 text-lg max-w-2xl mx-auto">
                                Forget boring lectures and endless slides. We use proven methods that change how you think, act, and sell.
                            </p>
                        </div>

                        <div className="max-w-4xl mx-auto space-y-8">
                            {methods.map((method, i) => (
                                <div key={i} className={`flex flex-col ${i % 2 === 0 ? 'sm:flex-row' : 'sm:flex-row-reverse'} gap-8 items-center bg-gray-50 rounded-tl-3xl rounded-br-3xl p-8 border border-gray-100`}>
                                    <div className="shrink-0 w-20 h-20 bg-primary text-white rounded-tl-2xl rounded-br-2xl flex items-center justify-center shadow-lg">
                                        <method.icon className="h-10 w-10" />
                                    </div>
                                    <div>
                                        <h3 className="font-headline font-bold text-2xl text-primary mb-3">{method.title}</h3>
                                        <p className="text-gray-500 leading-relaxed text-lg">{method.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── CTA ── */}
                <section className="py-24 bg-primary">
                    <div className="container mx-auto px-6 text-center">
                        <h2 className="font-headline text-4xl sm:text-5xl font-extrabold text-white mb-5">
                            Ready to Start Your Journey?
                        </h2>
                        <p className="text-white/60 text-xl max-w-2xl mx-auto mb-10">
                            Find the programme that matches your current level and start building your career with intention.
                        </p>
                        <div className="flex flex-col sm:flex-row justify-center gap-4">
                            <Button size="lg" className="rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none bg-accent hover:bg-accent/90 text-white h-14 px-10 font-bold shadow-lg w-full sm:w-auto" asChild>
                                <Link href="/courses">Browse All Programmes <ArrowRight className="ml-2 h-5 w-5" /></Link>
                            </Button>
                            <Button size="lg" variant="outline" className="rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none border-white/30 text-white hover:bg-white hover:text-primary h-14 px-10 font-bold transition-all w-full sm:w-auto" asChild>
                                <Link href="/contact">Talk to an Advisor</Link>
                            </Button>
                        </div>
                    </div>
                </section>

            </main>
            <Footer />
        </div>
    );
}
