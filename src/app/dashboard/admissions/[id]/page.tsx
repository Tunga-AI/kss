'use client';
import { useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useFirestore, useUser, useCollection, useDoc } from '@/firebase';
import { collection, query, where, doc, limit } from 'firebase/firestore';
import { usePaystackPayment } from 'react-paystack';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
    ArrowLeft, Users, CalendarDays, BookOpen, Zap, ArrowRight,
    FolderKanban, CheckCircle, Clock, RefreshCw, Info, Award, Loader2
} from 'lucide-react';
import Link from 'next/link';
import type { Cohort } from '@/lib/cohort-types';
import type { Program } from '@/lib/program-types';
import type { Admission } from '@/lib/admission-types';
import { cn } from '@/lib/utils';
import { createAdmission } from '@/lib/admissions';

// ─────────────────────────────────────────────────────────────────────────────
// IntakePayButton — charges admissionCost only, pre-fills from user profile
// ─────────────────────────────────────────────────────────────────────────────
function IntakePayButton({ program, cohort, onClose }: { program: Program; cohort: Cohort; onClose: () => void }) {
    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    const router = useRouter();
    const [phone, setPhone] = useState(user?.phone || '');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const admissionFee = program.admissionCost || 5000;
    const needsPhone = !user?.phone;

    const initPaystack = usePaystackPayment({
        publicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY!,
        email: user?.email || '',
        amount: Math.round(admissionFee * 100),
        currency: 'KES' as const,
        reference: `KSS_ADM_${Date.now()}`,
        metadata: {
            custom_fields: [
                { display_name: 'Full Name', variable_name: 'full_name', value: user?.name },
                { display_name: 'Phone', variable_name: 'phone', value: phone },
                { display_name: 'Program', variable_name: 'program', value: `Admission Fee – ${program.programName || program.title}` },
                { display_name: 'Program ID', variable_name: 'program_id', value: program.id },
            ],
            learnerName: user?.name,
            learnerEmail: user?.email,
            learnerPhone: phone,
            programId: program.id,
            isCoreCourse: true,
        },
    } as any);

    const formatPhone = (p: string) => {
        const cleaned = p.replace(/\D/g, '');
        if (cleaned.startsWith('254')) return `+${cleaned}`;
        if (cleaned.startsWith('0')) return `+254${cleaned.substring(1)}`;
        if (cleaned.length === 9) return `+254${cleaned}`;
        return null;
    };

    const handleApply = async () => {
        if (!user || !firestore) return;
        const formattedPhone = formatPhone(phone);
        if (!formattedPhone) {
            toast({ variant: 'destructive', title: 'Invalid Phone', description: 'Enter a valid Kenyan number e.g. 0712345678' });
            return;
        }
        setIsSubmitting(true);
        try {
            await createAdmission(firestore, {
                userId: user.id, name: user.name, email: user.email, phone: formattedPhone,
                status: 'Pending Payment' as const, cohortId: cohort.id,
                interestedProgramId: program.id,
                interestedProgramTitle: program.programName || program.title,
                assessmentRequired: true, assessmentCompleted: false,
            });
            initPaystack({
                onSuccess: async (response: any) => {
                    setIsSubmitting(false);
                    toast({ title: 'Payment Successful', description: 'Application submitted!' });
                    try {
                        await fetch('/api/paystack/verify', {
                            method: 'POST', headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ reference: response.reference, metadata: { learnerName: user.name, learnerEmail: user.email, learnerPhone: formattedPhone, programId: program.id, cohortId: cohort.id, isCoreCourse: true, redirectUrl: '/l/admissions', userId: user.id } }),
                        });
                    } catch (e) { console.error(e); }
                    onClose(); router.push('/l/admissions');
                },
                onClose: () => { setIsSubmitting(false); onClose(); router.push('/l/admissions'); },
            });
        } catch (e) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not start application. Try again.' });
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 space-y-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-primary/40">Applying as</p>
                <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                        <span className="text-accent font-black">{user?.name?.[0] || '?'}</span>
                    </div>
                    <div>
                        <p className="font-bold text-primary text-sm">{user?.name}</p>
                        <p className="text-xs text-primary/50">{user?.email}</p>
                    </div>
                </div>
            </div>
            {needsPhone && (
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-primary/50 ml-1">Phone <span className="text-red-500">*</span></label>
                    <Input type="tel" placeholder="0712 345 678" value={phone} onChange={(e) => setPhone(e.target.value)}
                        className="h-12 bg-white border-primary/10 rounded-tl-xl rounded-br-xl font-bold" />
                    <p className="text-[10px] text-primary/40 ml-1">Add to <Link href="/l/profile" className="text-accent underline font-bold">profile</Link> to skip next time.</p>
                </div>
            )}
            <div className="bg-accent/5 border border-accent/20 rounded-xl p-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-accent mb-1">Admission Fee</p>
                <p className="text-2xl font-black text-primary">KES {admissionFee.toLocaleString()}</p>
                <p className="text-xs text-primary/50 mt-1">Non-refundable · covers assessment & council review. Full fee collected after placement.</p>
            </div>
            <Button onClick={handleApply} disabled={isSubmitting || (needsPhone && !phone)}
                className="w-full bg-accent hover:bg-accent/90 text-white font-black text-[10px] uppercase tracking-widest h-14 rounded-tl-xl rounded-br-xl shadow-lg">
                {isSubmitting
                    ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Processing...</>
                    : <><Zap className="mr-2 h-4 w-4" />Pay KES {admissionFee.toLocaleString()} & Apply</>
                }
            </Button>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Apply Dialog
// ─────────────────────────────────────────────────────────────────────────────
function ApplyDialog({ cohort, allPrograms, hasExistingAdmission }: {
    cohort: Cohort; allPrograms: Program[]; hasExistingAdmission: boolean;
}) {
    const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
    const [open, setOpen] = useState(false);
    const cohortPrograms = useMemo(() => {
        if (!cohort.programIds?.length) return [];
        return allPrograms.filter(p => cohort.programIds.includes(p.id));
    }, [cohort, allPrograms]);
    const isOpen = cohort.status === 'Accepting Applications';

    if (hasExistingAdmission) {
        return (
            <Button className="bg-primary/10 text-primary/50 font-bold h-14 px-8 rounded-tl-xl rounded-br-xl cursor-not-allowed" disabled>
                You already have an active application
            </Button>
        );
    }

    return (
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setSelectedProgram(null); }}>
            <DialogTrigger asChild>
                <Button disabled={!isOpen} className={cn(
                    "h-14 px-8 font-bold rounded-tl-xl rounded-br-xl shadow-lg text-sm",
                    isOpen ? "bg-accent hover:bg-accent/90 text-white" : "bg-primary/10 text-primary/40 cursor-not-allowed"
                )}>
                    {isOpen ? <><Zap className="h-4 w-4 mr-2" />Apply to This Intake</> : 'Applications Closed'}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-xl bg-white rounded-tl-3xl rounded-br-3xl rounded-tr-none rounded-bl-none border border-primary/10 p-0 overflow-hidden">
                <div className="bg-primary text-white p-6">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                            <FolderKanban className="h-6 w-6 text-accent" /> Apply to Intake
                        </DialogTitle>
                        <p className="text-white/60 text-sm mt-1">{cohort.name}</p>
                    </DialogHeader>
                    {cohort.startDate && (
                        <div className="flex items-center gap-2 mt-3 text-white/70 text-sm">
                            <CalendarDays className="h-4 w-4" />
                            Starts {new Date(cohort.startDate).toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </div>
                    )}
                </div>
                <div className="p-6 space-y-6">
                    {cohortPrograms.length === 0 ? (
                        <div className="text-center py-10 text-primary/40">
                            <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-30" />
                            <p className="font-bold uppercase tracking-widest text-sm">No programs linked yet</p>
                        </div>
                    ) : !selectedProgram ? (
                        <>
                            <p className="text-sm text-primary/70 font-medium">Select the program you want to apply for:</p>
                            <div className="space-y-3">
                                {cohortPrograms.map(program => (
                                    <button key={program.id} onClick={() => setSelectedProgram(program)}
                                        className="w-full flex items-center gap-4 p-4 border border-primary/10 rounded-tl-xl rounded-br-xl hover:border-accent/40 hover:bg-accent/5 transition-all group text-left">
                                        <div className="h-12 w-12 shrink-0 rounded-tl-lg rounded-br-lg bg-primary/5 flex items-center justify-center group-hover:bg-accent/10 transition-colors">
                                            <BookOpen className="h-5 w-5 text-primary/40 group-hover:text-accent transition-colors" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-primary leading-tight">{program.programName || program.title}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Badge className="text-[8px] font-black uppercase border-none px-2 py-0.5 bg-primary/10 text-primary/60">{program.programType}</Badge>
                                                {program.level && <span className="text-[10px] text-primary/40 font-bold uppercase">Level {program.level}</span>}
                                            </div>
                                        </div>
                                        <ArrowRight className="h-4 w-4 text-primary/30 group-hover:text-accent group-hover:translate-x-1 transition-all shrink-0" />
                                    </button>
                                ))}
                            </div>
                        </>
                    ) : (
                        <>
                            <button onClick={() => setSelectedProgram(null)}
                                className="text-[10px] font-black uppercase tracking-widest text-primary/40 hover:text-primary transition-colors">
                                ← Change Program
                            </button>
                            <IntakePayButton program={selectedProgram} cohort={cohort}
                                onClose={() => { setOpen(false); setSelectedProgram(null); }} />
                        </>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────
export default function IntakeDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = Array.isArray(params.id) ? params.id[0] : params.id;
    const firestore = useFirestore();
    const { user } = useUser();

    // Fetch this cohort
    const cohortRef = useMemo(() => firestore && id ? doc(firestore, 'cohorts', id) : null, [firestore, id]);
    const { data: cohort, loading: cohortLoading } = useDoc<Cohort>(cohortRef as any);

    // Fetch all programs (to match cohort.programIds)
    const programsQuery = useMemo(() => firestore ? query(collection(firestore, 'programs')) : null, [firestore]);
    const { data: allPrograms, loading: programsLoading } = useCollection<Program>(programsQuery as any);

    // Check if learner already has an admission
    const admissionQuery = useMemo(() => {
        if (!firestore || !user?.id) return null;
        return query(collection(firestore, 'admissions'), where('userId', '==', user.id), limit(1));
    }, [firestore, user]);
    const { data: admissions } = useCollection<Admission>(admissionQuery as any);
    const hasExistingAdmission = (admissions?.length ?? 0) > 0;

    // Programs linked to this cohort
    const cohortPrograms = useMemo(() => {
        if (!cohort?.programIds?.length || !allPrograms) return [];
        return allPrograms
            .filter(p => cohort.programIds.includes(p.id))
            .sort((a, b) => (a.level ?? 0) - (b.level ?? 0));
    }, [cohort, allPrograms]);

    const loading = cohortLoading || programsLoading;

    if (loading) {
        return (
            <div className="p-8 flex items-center justify-center min-h-screen">
                <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!cohort) {
        return (
            <div className="p-8 text-center">
                <p className="text-primary/40 font-bold uppercase tracking-widest">Intake not found</p>
                <Button variant="outline" className="mt-4" onClick={() => router.back()}>Go Back</Button>
            </div>
        );
    }

    const isOpen = cohort.status === 'Accepting Applications';

    return (
        <div className="w-full min-h-screen bg-gray-50/50 p-2 md:p-4 font-body">
            <div className="w-full max-w-5xl mx-auto">

                {/* Hero */}
                <div className="bg-primary text-white p-6 mb-6 rounded-tl-3xl rounded-br-3xl shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-accent/20 rounded-full blur-3xl opacity-20" />
                    <div className="relative z-10">
                        <button
                            onClick={() => router.back()}
                            className="flex items-center gap-2 text-white/60 hover:text-white text-sm font-bold uppercase tracking-widest mb-4 transition-colors"
                        >
                            <ArrowLeft className="h-4 w-4" /> Back to Intakes
                        </button>

                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                            <div>
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="h-12 w-12 bg-accent/20 rounded-tl-xl rounded-br-xl flex items-center justify-center">
                                        <FolderKanban className="h-6 w-6 text-accent" />
                                    </div>
                                    <Badge className={cn(
                                        "border-none font-bold text-[9px] uppercase tracking-widest px-3 py-1",
                                        isOpen ? "bg-green-500 text-white" :
                                            cohort.status === 'Closed' ? "bg-white/20 text-white/60" : "bg-accent text-white"
                                    )}>
                                        {cohort.status}
                                    </Badge>
                                </div>
                                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-2">{cohort.name}</h1>
                                {cohort.description && (
                                    <p className="text-white/70 max-w-xl text-base leading-relaxed">{cohort.description}</p>
                                )}
                            </div>

                            {/* Apply CTA */}
                            <div className="shrink-0">
                                <ApplyDialog
                                    cohort={cohort}
                                    allPrograms={allPrograms || []}
                                    hasExistingAdmission={hasExistingAdmission}
                                />
                            </div>
                        </div>

                        {/* Meta strip */}
                        <div className="flex flex-wrap gap-6 mt-6 pt-6 border-t border-white/10">
                            {cohort.startDate && (
                                <div className="flex items-center gap-2 text-white/70 text-sm">
                                    <CalendarDays className="h-4 w-4 text-accent" />
                                    <span className="font-bold">Start:</span>
                                    {new Date(cohort.startDate).toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' })}
                                </div>
                            )}
                            {cohort.endDate && (
                                <div className="flex items-center gap-2 text-white/70 text-sm">
                                    <Clock className="h-4 w-4 text-accent" />
                                    <span className="font-bold">End:</span>
                                    {new Date(cohort.endDate).toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' })}
                                </div>
                            )}
                            <div className="flex items-center gap-2 text-white/70 text-sm">
                                <BookOpen className="h-4 w-4 text-accent" />
                                <span className="font-bold">{cohortPrograms.length}</span> Program{cohortPrograms.length !== 1 ? 's' : ''}
                            </div>
                            {cohort.council && cohort.council.length > 0 && (
                                <div className="flex items-center gap-2 text-white/70 text-sm">
                                    <Users className="h-4 w-4 text-accent" />
                                    <span className="font-bold">{cohort.council.length}</span> Council Members
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Already applied notice */}
                {hasExistingAdmission && (
                    <div className="mb-6 bg-green-50 border border-green-200 rounded-tl-xl rounded-br-xl p-4 flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
                        <div>
                            <p className="font-bold text-green-800 text-sm">You already have an active application</p>
                            <p className="text-green-600 text-xs mt-0.5">Track your progress on the <a href="/l/admissions" className="underline font-bold">Admissions page</a>.</p>
                        </div>
                    </div>
                )}

                {/* Programs in this intake */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-4">
                        <BookOpen className="h-5 w-5 text-primary" />
                        <h2 className="text-xl font-bold text-primary">Programs in This Intake</h2>
                    </div>

                    {cohortPrograms.length === 0 ? (
                        <div className="bg-white border border-primary/10 rounded-tl-2xl rounded-br-2xl p-12 text-center">
                            <BookOpen className="h-10 w-10 mx-auto text-primary/20 mb-3" />
                            <p className="font-bold text-primary/40 uppercase tracking-widest text-sm">No programs linked yet</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {cohortPrograms.map(program => (
                                <div
                                    key={program.id}
                                    className="bg-white border border-primary/10 rounded-tl-2xl rounded-br-2xl p-5 shadow-sm hover:shadow-md hover:border-accent/20 transition-all group"
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="h-12 w-12 shrink-0 rounded-tl-lg rounded-br-lg bg-accent/10 flex items-center justify-center group-hover:bg-accent group-hover:text-white transition-all">
                                            <BookOpen className="h-5 w-5 text-accent group-hover:text-white transition-colors" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap mb-1">
                                                <Badge className="text-[8px] font-black uppercase border-none px-2 py-0.5 bg-primary/10 text-primary/60">
                                                    {program.programType}
                                                </Badge>
                                                {program.level && (
                                                    <span className="text-[10px] text-accent font-black uppercase bg-accent/10 px-2 py-0.5 rounded">
                                                        Level {program.level}
                                                    </span>
                                                )}
                                            </div>
                                            <h3 className="font-bold text-primary leading-tight">{program.programName || program.title}</h3>
                                            <p className="text-xs text-primary/60 mt-1 line-clamp-2">{program.shortDescription || program.description}</p>

                                            <div className="flex items-center gap-4 mt-3 pt-3 border-t border-primary/5">
                                                {program.programDuration && (
                                                    <div className="flex items-center gap-1 text-[10px] text-primary/40 font-bold uppercase">
                                                        <Clock className="h-3 w-3" />
                                                        {program.programDuration}
                                                    </div>
                                                )}
                                                {program.price && (
                                                    <div className="flex items-center gap-1 text-[10px] text-primary/40 font-bold uppercase">
                                                        <Award className="h-3 w-3" />
                                                        KES {Number(program.price).toLocaleString()}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Admission Process info */}
                <div className="bg-white border border-primary/10 rounded-tl-2xl rounded-br-2xl p-6 shadow-sm mb-8">
                    <div className="flex items-center gap-3 mb-5">
                        <Info className="h-5 w-5 text-accent" />
                        <h2 className="text-xl font-bold text-primary">How Admission Works</h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                        {[
                            { step: '01', title: 'Pay Fee', desc: 'Non-refundable admission fee (KES 5,000) processes your application.', icon: Zap },
                            { step: '02', title: 'Assessment', desc: 'Complete a short skills assessment at your own pace.', icon: BookOpen },
                            { step: '03', title: 'Council Review', desc: 'Our academic council reviews your profile and assessment.', icon: Users },
                            { step: '04', title: 'Placement', desc: 'Receive your placement decision and start your program.', icon: CheckCircle },
                        ].map(({ step, title, desc, icon: Icon }) => (
                            <div key={step} className="flex flex-col items-center text-center p-4 rounded-xl bg-primary/3 border border-primary/5">
                                <div className="h-10 w-10 rounded-tl-lg rounded-br-lg bg-accent/10 text-accent flex items-center justify-center mb-3">
                                    <Icon className="h-5 w-5" />
                                </div>
                                <span className="text-[9px] font-black uppercase tracking-widest text-accent mb-1">Step {step}</span>
                                <h4 className="font-bold text-primary text-sm mb-1">{title}</h4>
                                <p className="text-[10px] text-primary/50 leading-relaxed">{desc}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Bottom CTA */}
                {isOpen && !hasExistingAdmission && (
                    <div className="bg-accent/5 border border-accent/20 rounded-tl-2xl rounded-br-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div>
                            <h3 className="font-bold text-primary text-lg">Ready to apply?</h3>
                            <p className="text-primary/60 text-sm">Join {cohort.name} and start your professional sales journey.</p>
                        </div>
                        <ApplyDialog
                            cohort={cohort}
                            allPrograms={allPrograms || []}
                            hasExistingAdmission={hasExistingAdmission}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
