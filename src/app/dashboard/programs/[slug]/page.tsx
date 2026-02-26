'use client';

import { useMemo } from 'react';
import { notFound, useParams } from 'next/navigation';
import Image from 'next/image';
import { useUser, useFirestore, useCollection, useDoc } from '@/firebase';
import { collection, query, where, limit, doc } from 'firebase/firestore';
import { Program } from '@/lib/program-types';
import { ProgramRegistration } from '@/components/payments/ProgramRegistration';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Loader2, Calendar, MapPin, Clock, CheckCircle2, BookOpen, Layers, Users, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { cn } from "@/lib/utils";

export default function ProgramDetailsPage() {
    const params = useParams();
    const slug = params?.slug as string;
    const { user, loading: userLoading } = useUser();
    const firestore = useFirestore();

    // 1a. Try fetching by slug
    const programQuery = useMemo(() => {
        if (!firestore || !slug) return null;
        return query(collection(firestore, 'programs'), where('slug', '==', slug), limit(1));
    }, [firestore, slug]);

    const { data: programs, loading: slugLoading } = useCollection<Program>(programQuery as any);

    // 1b. Fall back to doc ID lookup if slug query returns nothing
    const programDocRef = useMemo(() => {
        if (!firestore || !slug || (programs && programs.length > 0)) return null;
        return doc(firestore, 'programs', slug);
    }, [firestore, slug, programs]);

    const { data: programById, loading: idLoading } = useDoc<Program>(programDocRef as any);

    const programLoading = slugLoading || idLoading;
    const program = programs?.[0] || programById;

    // 2. Determine Loading State
    if (userLoading || programLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    // 3. Handle Not Found
    if (!program) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <h2 className="text-2xl font-bold text-primary">Program Not Found</h2>
                <p className="text-primary/60">The program you are looking for does not exist or has been removed.</p>
                <Button asChild>
                    <Link href="/l/programs">Back to Programs</Link>
                </Button>
            </div>
        );
    }

    // Helper to format date
    const formatDate = (dateString?: string | any) => {
        if (!dateString) return 'Ongoing / Flexible';
        // Handle Firestore Timestamp
        const date = dateString.toDate ? dateString.toDate() : new Date(dateString);
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const title = program.programName || program.title || 'Untitled Program';
    const image = program.image || program.imageUrl;
    const description = program.shortDescription || program.description;
    const duration = program.programDuration || program.duration;
    const currency = program.currency || 'KES';
    const price = typeof program.price === 'number'
        ? (program.price > 0 ? `${currency} ${program.price.toLocaleString()}` : 'Free')
        : (program.price || 'Free');
    const admissionCost = program.admissionCost ?? (program as any).registrationFee ?? 0;
    const objectives = program.objectives || (program as any).takeaways || [];
    const curriculum = program.curriculumBreakdown || [];
    // Legacy units support if curriculum is empty
    const legacyUnits = (!curriculum.length && (program as any).units) ? (program as any).units : [];

    return (
        <div className="w-full min-h-screen bg-gray-50/50 p-4 md:p-8 font-body">
            <div className="w-full">
                {/* Back Navigation */}
                <div className="mb-6">
                    <Link href="/l/programs" className="inline-flex items-center text-sm font-bold text-primary/60 hover:text-primary transition-colors">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to All Programs
                    </Link>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-12 w-full">
                    {/* Main Content Column */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Hero Section */}
                        <div className="bg-white rounded-tl-3xl rounded-br-3xl rounded-tr-none rounded-bl-none overflow-hidden shadow-2xl border border-primary/5">
                            <div className="relative aspect-video w-full bg-primary/5">
                                {image ? (
                                    <Image
                                        src={image}
                                        alt={title}
                                        fill
                                        className="object-cover"
                                        priority
                                    />
                                ) : (
                                    <div className="flex h-full w-full items-center justify-center">
                                        <BookOpen className="h-24 w-24 text-primary/20" />
                                    </div>
                                )}
                                <div className="absolute top-6 left-6 flex gap-2">
                                    <Badge className={cn(
                                        "text-xs font-bold uppercase tracking-widest px-3 py-1.5 shadow-lg backdrop-blur-md border-none rounded-tl-lg rounded-br-lg rounded-tr-none rounded-bl-none",
                                        program.programType === 'Event' ? 'bg-accent text-white' : 'bg-white/90 text-primary'
                                    )}>
                                        {program.programType || 'Program'}
                                    </Badge>
                                    {program.status && (
                                        <Badge variant="outline" className="bg-black/50 text-white border-white/20 backdrop-blur-md rounded-tl-lg rounded-br-lg rounded-tr-none rounded-bl-none">
                                            {program.status}
                                        </Badge>
                                    )}
                                </div>
                            </div>

                            <div className="p-8">
                                <h1 className="text-3xl sm:text-5xl font-black text-primary mb-4 leading-tight">
                                    {title}
                                </h1>

                                <div className="flex flex-wrap gap-4 text-sm text-primary/60 mb-8 pb-8 border-b border-primary/10">
                                    {((program as any).date || (program.intakes && program.intakes.length > 0)) && (
                                        <div className="flex items-center gap-2 font-bold uppercase tracking-wide text-xs">
                                            <Calendar className="h-4 w-4 text-accent" />
                                            {(program as any).date ? formatDate((program as any).date) : (program.intakes?.[0]?.startDate ? formatDate(program.intakes[0].startDate) : 'See Intakes')}
                                        </div>
                                    )}
                                    {duration && (
                                        <div className="flex items-center gap-2 font-bold uppercase tracking-wide text-xs">
                                            <Clock className="h-4 w-4 text-accent" />
                                            {duration}
                                        </div>
                                    )}
                                    {((program as any).location || (program.programFormat && program.programFormat.length > 0)) && (
                                        <div className="flex items-center gap-2 font-bold uppercase tracking-wide text-xs">
                                            <MapPin className="h-4 w-4 text-accent" />
                                            {(program as any).location || program.programFormat?.[0]}
                                        </div>
                                    )}
                                    {((program as any).competencyLevelName || program.level) && (
                                        <div className="flex items-center gap-2 font-bold uppercase tracking-wide text-xs">
                                            <Layers className="h-4 w-4 text-accent" />
                                            {(program as any).competencyLevelName ? `${(program as any).competencyLevelName} Level` : `Level ${program.level}`}
                                        </div>
                                    )}
                                </div>

                                <div className="prose prose-primary prose-lg max-w-none text-primary/80 leading-relaxed">
                                    <h3 className="text-xl font-black text-primary mb-4 uppercase tracking-widest border-l-4 border-accent pl-4">About this Program</h3>
                                    <p className="whitespace-pre-line">{description}</p>
                                </div>
                            </div>
                        </div>

                        {/* Curriculum / Syllabus Section */}
                        {(curriculum.length > 0 || legacyUnits.length > 0) && (
                            <div className="bg-white rounded-tl-3xl rounded-br-3xl rounded-tr-none rounded-bl-none p-8 shadow-xl border border-primary/5">
                                <h3 className="text-2xl font-black text-primary mb-8 flex items-center gap-3">
                                    <div className="p-2 bg-accent/10 rounded-lg">
                                        <Layers className="h-6 w-6 text-accent" />
                                    </div>
                                    Curriculum & Modules
                                </h3>
                                <div className="grid gap-4">
                                    {curriculum.length > 0 ? (
                                        curriculum.map((module, idx) => (
                                            <div key={idx} className="p-5 rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none bg-gray-50 border border-primary/5 hover:border-accent/20 hover:bg-white hover:shadow-md transition-all group">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-tl-lg rounded-br-lg rounded-tr-none rounded-bl-none bg-primary text-white text-xs font-bold group-hover:bg-accent transition-colors">
                                                        {String(idx + 1).padStart(2, '0')}
                                                    </span>
                                                    <span className="font-bold text-primary group-hover:text-accent transition-colors text-lg">{module.name}</span>
                                                </div>
                                                <p className="text-sm text-primary/70 mb-1"><span className="font-bold text-xs uppercase tracking-wide">Key Modules:</span> {module.keyModules}</p>
                                                {module.themes && <p className="text-sm text-primary/70"><span className="font-bold text-xs uppercase tracking-wide">Themes:</span> {module.themes}</p>}
                                            </div>
                                        ))
                                    ) : (
                                        legacyUnits.map((unit: string, idx: number) => (
                                            <div key={idx} className="flex items-center gap-4 p-5 rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none bg-gray-50 border border-primary/5 hover:border-accent/20 hover:bg-white hover:shadow-md transition-all group">
                                                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-tl-lg rounded-br-lg rounded-tr-none rounded-bl-none bg-primary text-white text-sm font-bold group-hover:bg-accent transition-colors">
                                                    {String(idx + 1).padStart(2, '0')}
                                                </span>
                                                <span className="font-bold text-primary group-hover:text-accent transition-colors text-lg">{unit}</span>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Objectives / Takeaways Section */}
                        {objectives.length > 0 && (
                            <div className="bg-white rounded-tl-3xl rounded-br-3xl rounded-tr-none rounded-bl-none p-8 shadow-xl border border-primary/5">
                                <h3 className="text-2xl font-black text-primary mb-8 flex items-center gap-3">
                                    <div className="p-2 bg-green-500/10 rounded-lg">
                                        <CheckCircle2 className="h-6 w-6 text-green-600" />
                                    </div>
                                    Learning Outcomes
                                </h3>
                                <ul className="grid sm:grid-cols-2 gap-6">
                                    {objectives.map((outcome, idx) => (
                                        <li key={idx} className="flex items-start gap-4 text-primary/80">
                                            <div className="mt-1 h-2 w-2 rounded-full bg-green-500 shrink-0" />
                                            <span className="text-base font-medium leading-relaxed">{outcome}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>

                    {/* Sidebar Column (Registration & Sticky Actions) */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-8 space-y-6">
                            {/* Registration Card */}
                            <div className="bg-white rounded-tl-3xl rounded-br-3xl rounded-tr-none rounded-bl-none shadow-2xl border border-primary/10 overflow-hidden relative">
                                {/* Decorative header background */}
                                <div className="h-32 bg-primary relative overflow-hidden">
                                    <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '20px 20px' }}></div>
                                    <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-accent/20 blur-3xl opacity-50" />
                                    <div className="absolute left-6 top-6 h-12 w-12 rounded-full bg-white/10 blur-xl" />
                                </div>

                                <div className="px-6 pb-8 -mt-20 relative z-10">
                                    <div className="bg-white rounded-tl-2xl rounded-br-2xl rounded-tr-none rounded-bl-none p-6 shadow-xl border border-primary/5 text-center mb-8">
                                        <p className="text-xs font-black text-primary/40 uppercase tracking-widest mb-2">
                                            {program.programType === 'Event' ? 'Ticket Price' : 'Program Fee'}
                                        </p>
                                        <div className="flex items-center justify-center gap-1 text-primary mb-3">
                                            <span className="text-4xl font-black tracking-tight">{price}</span>
                                        </div>
                                        {admissionCost > 0 && (
                                            <div className="mt-2 pt-3 border-t border-primary/10">
                                                <p className="text-[10px] font-black text-primary/40 uppercase tracking-widest mb-1">Admission Fee</p>
                                                <p className="text-lg font-black text-accent">{currency} {Number(admissionCost).toLocaleString()}</p>
                                                <p className="text-[9px] text-primary/40 mt-1">Non-refundable application fee</p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-6">
                                        <ProgramRegistration program={program} />

                                        <div className="flex items-center justify-center gap-2 text-xs text-primary/30 font-bold uppercase tracking-widest">
                                            <Users className="h-3 w-3" />
                                            <span className="font-bold">{(program as any).enrolledCount || 0} Already Enrolled</span>
                                        </div>

                                        <p className="text-[10px] text-center text-primary/40 leading-relaxed px-4 border-t border-primary/5 pt-4">
                                            By registering, you agree to our Terms of Service and Privacy Policy. Secure payment processing via Paystack.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Additional Info Cards if needed (e.g., Contact Support) */}
                            <div className="bg-primary/5 rounded-tl-3xl rounded-br-3xl rounded-tr-none rounded-bl-none p-8 border border-primary/5 text-center">
                                <h4 className="font-bold text-primary mb-2 uppercase tracking-wide text-sm">Need Assistance?</h4>
                                <p className="text-sm text-primary/60 mb-6 leading-relaxed">
                                    Contact our admissions team for personalized guidance on your application.
                                </p>
                                <Button variant="outline" className="w-full bg-white border-primary/10 hover:bg-primary hover:text-white h-12 rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none font-bold uppercase tracking-widest text-xs shadow-sm" asChild>
                                    <Link href="/contact">Contact Support</Link>
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
