'use client';
import { useMemo, useState, useEffect } from 'react';
import { useFirestore, useUser, useCollection } from '@/firebase';
import { collection, query, where, limit } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { usePaystackPayment } from 'react-paystack';
import { useToast } from '@/hooks/use-toast';
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
    RefreshCw, Search, ChevronDown, CheckCircle, Clock, FileText, LayoutGrid,
    Eye, ArrowRight, XCircle, FolderKanban, Layers, Users, Zap, BookOpen,
    CalendarDays, Loader2, UserCircle
} from "lucide-react";
import Link from 'next/link';
import type { Cohort } from '@/lib/cohort-types';
import type { Admission } from '@/lib/admission-types';
import type { Program } from '@/lib/program-types';
import { cn } from "@/lib/utils";
import { createAdmission } from '@/lib/admissions';
import { ProgramRegistration } from '@/components/payments/ProgramRegistration';

// ─────────────────────────────────────────────────────────────────────────────
// Horizontal Status Stepper
// ─────────────────────────────────────────────────────────────────────────────
const HorizontalStatusStep = ({ icon, title, description, isComplete, isActive }: {
    icon: React.ElementType; title: string; description: string; isComplete?: boolean; isActive?: boolean;
}) => {
    const Icon = icon;
    return (
        <div className="flex flex-col items-center text-center relative flex-1 px-2 group">
            <div className={cn("absolute top-6 left-1/2 w-full h-1 -z-10", isComplete ? "bg-green-500" : "bg-primary/5")} style={{ left: '50%' }} />
            <div className={cn(
                "flex h-12 w-12 items-center justify-center rounded-full transition-all duration-300 shadow-md mb-3 z-10",
                isComplete ? 'bg-green-500 text-white shadow-green-500/20' :
                    isActive ? 'bg-accent text-white shadow-accent/20 animate-pulse' :
                        'bg-primary/5 text-primary/40'
            )}>
                <Icon className="h-5 w-5" />
            </div>
            <h4 className={cn("font-bold text-xs uppercase tracking-widest mb-1", isActive ? "text-accent" : "text-primary")}>{title}</h4>
            <div className="hidden group-hover:block absolute top-full left-0 right-0 pt-2 bg-white z-20 p-2 shadow-xl border border-primary/10 rounded-lg text-xs text-primary/70 animate-in fade-in slide-in-from-top-2">
                {description}
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// Admission Progress Dialog
// ─────────────────────────────────────────────────────────────────────────────
function AdmissionDetailsDialog({ admission, cohort }: { admission: Admission; cohort?: Cohort }) {
    const firestore = useFirestore();
    const { user } = useUser();
    const status = admission.status;
    const resolvedProgramId = admission?.finalProgramId || admission?.recommendedProgramId;
    const programQuery = useMemo(() => {
        if (!firestore || !resolvedProgramId) return null;
        return query(collection(firestore, 'programs'), where('__name__', '==', resolvedProgramId));
    }, [firestore, resolvedProgramId]);
    const { data: programs } = useCollection<Program>(programQuery as any);
    const recommendedProgram = programs?.[0];

    const hasPaid = status !== 'Pending Payment';
    const profileComplete = !!user?.professionalProfile?.experience?.length || !!user?.professionalProfile?.education?.length || !!user?.professionalProfile?.summary;
    const assessmentComplete = admission.assessmentCompleted;
    const isDecided = ['Placed', 'Admitted', 'Rejected'].includes(status);

    const steps = [
        { key: 'Pending Payment', title: 'Fee', description: 'Application Assessment Fee', icon: FileText, complete: hasPaid, active: status === 'Pending Payment' },
        { key: 'Profile', title: 'Profile', description: 'Complete Profile Details', icon: UserCircle, complete: profileComplete, active: hasPaid && !profileComplete },
        { key: 'Pending Assessment', title: 'Assessment', description: 'Skills Verification', icon: LayoutGrid, complete: assessmentComplete, active: hasPaid && profileComplete && status === 'Pending Assessment' },
        { key: 'Pending Review', title: 'Review', description: 'Council Review', icon: Clock, complete: isDecided, active: status === 'Pending Review' && assessmentComplete },
        { key: 'Placed', title: 'Decision', description: 'Final Placement', icon: CheckCircle, complete: isDecided, active: isDecided },
    ];

    return (
        <div className="space-y-8 py-4">
            <div className="relative flex justify-between w-full overflow-hidden">
                {steps.map((step, index) => (
                    <div key={step.key} className={cn("flex-1", index === steps.length - 1 ? "flex-grow-0" : "")}>
                        <HorizontalStatusStep {...step} />
                        {index === steps.length - 1 && <div className="absolute top-6 left-[calc(50%+24px)] right-0 h-1 bg-white z-0" />}
                    </div>
                ))}
            </div>

            <div className="mt-8">
                {(status === 'Admitted' || status === 'Placed') && recommendedProgram ? (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
                        <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-green-800 mb-2">Congratulations!</h3>
                        <p className="text-green-700 mb-2">You have been placed into <strong>{recommendedProgram.title}</strong>.</p>
                        {admission.finalCohortTitle && (
                            <p className="text-green-600 text-sm mb-4">Intake: <strong>{admission.finalCohortTitle}</strong></p>
                        )}
                        <div className="flex justify-center gap-4 mb-6">
                            <Button variant="outline" className="border-green-300 text-green-700 hover:bg-green-100" asChild>
                                <Link href="/l/profile">View Profile</Link>
                            </Button>
                            <Button variant="outline" className="border-green-300 text-green-700 hover:bg-green-100" asChild>
                                <Link href="/l/assessment">View Results</Link>
                            </Button>
                        </div>
                        <div className="bg-white p-4 rounded-lg border border-green-100 mb-4">
                            <ProgramRegistration program={recommendedProgram} />
                        </div>
                    </div>
                ) : status === 'Rejected' ? (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                        <XCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-red-800 mb-2">Application Update</h3>
                        <p className="text-red-700 mb-4">We are unable to offer you a spot in this cohort at this time.</p>
                        <Button variant="outline" className="border-red-200 text-red-700 hover:bg-red-100" asChild>
                            <Link href="/courses">Explore Other Programs</Link>
                        </Button>
                    </div>
                ) : status === 'Pending Assessment' && !profileComplete ? (
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-center">
                        <UserCircle className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-blue-800 mb-2">Complete Your Profile</h3>
                        <p className="text-blue-700 mb-6">Before taking your assessment, please build your professional profile.</p>
                        <Button className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 shadow-lg" asChild>
                            <Link href="/l/profile">Complete Profile</Link>
                        </Button>
                    </div>
                ) : status === 'Pending Assessment' && profileComplete ? (
                    <div className="bg-accent/5 border border-accent/20 rounded-xl p-6 text-center">
                        <FileText className="h-12 w-12 text-accent mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-primary mb-2">Assessment Required</h3>
                        <p className="text-primary/70 mb-6">Please complete the admission assessment to proceed.</p>
                        <Button className="bg-accent hover:bg-accent/90 text-white font-bold px-8 shadow-lg" asChild>
                            <Link href="/l/assessment">Take Assessment</Link>
                        </Button>
                    </div>
                ) : (
                    <div className="bg-primary/5 border border-primary/10 rounded-xl p-6 text-center">
                        <Clock className="h-12 w-12 text-primary/40 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-primary mb-2">In Progress</h3>
                        <p className="text-primary/60">
                            {status === 'Pending Payment' ? 'Please complete the application fee payment.' : 'Your application is currently under review.'}
                        </p>
                    </div>
                )}
            </div>
            <div className="text-center text-xs text-primary/40 uppercase tracking-widest mt-8">
                Applying for {cohort?.name || 'Cohort'}
            </div>
        </div>
    );
}

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
                userId: user.id,
                name: user.name,
                email: user.email,
                phone: formattedPhone,
                status: 'Pending Payment' as const,
                cohortId: cohort.id,
                interestedProgramId: program.id,
                interestedProgramTitle: program.programName || program.title,
                assessmentRequired: true,
                assessmentCompleted: false,
            });

            initPaystack({
                onSuccess: async (response: any) => {
                    setIsSubmitting(false);
                    toast({ title: 'Payment Successful', description: 'Your application has been submitted!' });
                    try {
                        await fetch('/api/paystack/verify', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                reference: response.reference,
                                metadata: {
                                    learnerName: user.name, learnerEmail: user.email,
                                    learnerPhone: formattedPhone, programId: program.id,
                                    cohortId: cohort.id, isCoreCourse: true,
                                    redirectUrl: '/l/admissions', userId: user.id,
                                },
                            }),
                        });
                    } catch (e) { console.error('Verify error:', e); }
                    onClose();
                    router.push('/l/admissions');
                },
                onClose: () => {
                    setIsSubmitting(false);
                    toast({ title: 'Payment Cancelled', description: 'Application saved. Pay anytime from Admissions.' });
                    onClose();
                    router.push('/l/admissions');
                },
            });
        } catch (e) {
            console.error(e);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not start your application. Please try again.' });
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-4">
            {/* Pre-filled user details */}
            <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 space-y-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-primary/40">Applying as</p>
                <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                        <span className="text-accent font-black">{user?.name?.[0] || '?'}</span>
                    </div>
                    <div>
                        <p className="font-bold text-primary text-sm leading-tight">{user?.name}</p>
                        <p className="text-xs text-primary/50">{user?.email}</p>
                    </div>
                </div>
            </div>

            {/* Phone input — only if missing from profile */}
            {needsPhone && (
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-primary/50 ml-1">
                        Phone Number <span className="text-red-500">*</span>
                    </label>
                    <Input
                        type="tel"
                        placeholder="0712 345 678"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="h-12 bg-white border-primary/10 rounded-tl-xl rounded-br-xl font-bold"
                    />
                    <p className="text-[10px] text-primary/40 ml-1">
                        Add it to your{' '}
                        <Link href="/l/profile" className="text-accent underline font-bold">profile</Link>{' '}
                        to skip this next time.
                    </p>
                </div>
            )}

            {/* Selected program summary */}
            <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 flex items-center gap-4">
                <div className="h-10 w-10 shrink-0 rounded-tl-lg rounded-br-lg bg-accent/10 flex items-center justify-center">
                    <BookOpen className="h-5 w-5 text-accent" />
                </div>
                <div>
                    <p className="font-bold text-primary text-sm">{program.programName || program.title}</p>
                    <p className="text-[10px] text-primary/50 uppercase font-bold mt-0.5">{cohort.name}</p>
                </div>
            </div>

            {/* Fee breakdown */}
            <div className="bg-accent/5 border border-accent/20 rounded-xl p-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-accent mb-1">Admission Fee</p>
                <p className="text-2xl font-black text-primary">KES {admissionFee.toLocaleString()}</p>
                <p className="text-xs text-primary/50 mt-1">
                    Non-refundable · covers assessment & council review.<br />
                    Full programme fee is collected after placement.
                </p>
            </div>

            <Button
                onClick={handleApply}
                disabled={isSubmitting || (needsPhone && !phone)}
                className="w-full bg-accent hover:bg-accent/90 text-white font-black text-[10px] uppercase tracking-widest h-14 rounded-tl-xl rounded-br-xl shadow-lg transition-all"
            >
                {isSubmitting
                    ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Processing...</>
                    : <><Zap className="mr-2 h-4 w-4" />Pay KES {admissionFee.toLocaleString()} & Submit Application</>
                }
            </Button>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Apply to Intake Dialog — pick program → pay
// ─────────────────────────────────────────────────────────────────────────────
function ApplyToIntakeDialog({ cohort, allPrograms }: { cohort: Cohort; allPrograms: Program[] }) {
    const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
    const [open, setOpen] = useState(false);

    const cohortPrograms = useMemo(() => {
        if (!cohort.programIds?.length) return [];
        return allPrograms.filter(p => cohort.programIds.includes(p.id));
    }, [cohort, allPrograms]);

    const isOpen = cohort.status === 'Accepting Applications';

    return (
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setSelectedProgram(null); }}>
            <DialogTrigger asChild>
                <Button
                    size="sm"
                    disabled={!isOpen}
                    className={cn(
                        "rounded-tl-md rounded-br-md shadow-md font-bold text-[10px] uppercase tracking-widest h-9 px-4",
                        isOpen ? "bg-accent hover:bg-accent/90 text-white" : "bg-primary/10 text-primary/40 cursor-not-allowed"
                    )}
                >
                    {isOpen ? <><Zap className="h-3.5 w-3.5 mr-1.5" />Apply Now</> : 'Closed'}
                </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-xl bg-white rounded-tl-3xl rounded-br-3xl rounded-tr-none rounded-bl-none border border-primary/10 p-0 overflow-hidden">
                <div className="bg-primary text-white p-6">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                            <FolderKanban className="h-6 w-6 text-accent" />
                            Apply to Intake
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
                            <p className="font-bold uppercase tracking-widest text-sm">No programs linked to this intake yet</p>
                        </div>
                    ) : !selectedProgram ? (
                        <>
                            <p className="text-sm text-primary/70 font-medium">Select the program you want to apply for:</p>
                            <div className="space-y-3">
                                {cohortPrograms.map(program => (
                                    <button
                                        key={program.id}
                                        onClick={() => setSelectedProgram(program)}
                                        className="w-full flex items-center gap-4 p-4 border border-primary/10 rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none hover:border-accent/40 hover:bg-accent/5 transition-all group text-left"
                                    >
                                        <div className="h-12 w-12 shrink-0 rounded-tl-lg rounded-br-lg bg-primary/5 flex items-center justify-center group-hover:bg-accent/10 transition-colors">
                                            <BookOpen className="h-5 w-5 text-primary/40 group-hover:text-accent transition-colors" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-primary leading-tight">{program.programName || program.title}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Badge className="text-[8px] font-black uppercase border-none px-2 py-0.5 bg-primary/10 text-primary/60">
                                                    {program.programType}
                                                </Badge>
                                                {program.level && (
                                                    <span className="text-[10px] text-primary/40 font-bold uppercase">Level {program.level}</span>
                                                )}
                                            </div>
                                            <p className="text-[10px] text-primary/50 mt-1 line-clamp-1">{program.shortDescription || program.description}</p>
                                        </div>
                                        <ArrowRight className="h-4 w-4 text-primary/30 group-hover:text-accent group-hover:translate-x-1 transition-all shrink-0" />
                                    </button>
                                ))}
                            </div>
                        </>
                    ) : (
                        <>
                            <button
                                onClick={() => setSelectedProgram(null)}
                                className="text-[10px] font-black uppercase tracking-widest text-primary/40 hover:text-primary transition-colors"
                            >
                                ← Change Program
                            </button>
                            <IntakePayButton
                                program={selectedProgram}
                                cohort={cohort}
                                onClose={() => { setOpen(false); setSelectedProgram(null); }}
                            />
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
export default function AdmissionsPage() {
    const firestore = useFirestore();
    const { user } = useUser();
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    type CohortWithAdmission = Cohort & { admission?: Admission };
    const [myCohort, setMyCohort] = useState<CohortWithAdmission | null>(null);

    const cohortsQuery = useMemo(() => firestore ? query(collection(firestore, 'cohorts')) : null, [firestore]);
    const { data: allCohorts, loading: cohortsLoading } = useCollection<Cohort>(cohortsQuery as any);

    const admissionQuery = useMemo(() => {
        if (!firestore || !user?.id) return null;
        return query(collection(firestore, 'admissions'), where('userId', '==', user.id), limit(1));
    }, [firestore, user]);
    const { data: admissions, loading: admissionLoading } = useCollection<Admission>(admissionQuery as any);

    const programsQuery = useMemo(() => firestore ? query(collection(firestore, 'programs')) : null, [firestore]);
    const { data: allPrograms, loading: programsLoading } = useCollection<Program>(programsQuery as any);

    useEffect(() => {
        if (admissions && admissions.length > 0 && allCohorts) {
            const admission = admissions[0];
            const cohortId = admission.finalCohortId || admission.cohortId;
            const cohort = allCohorts.find(c => c.id === cohortId);
            if (cohort) {
                setMyCohort({ ...cohort, admission });
            } else if (admission) {
                setMyCohort({ id: cohortId || '', name: admission.finalCohortTitle || 'Pending Assignment', status: 'In Review', council: [], programId: '', instructors: [], programIds: [], admission } as any);
            }
        }
    }, [admissions, allCohorts]);

    const otherCohorts = useMemo(() => {
        if (!allCohorts) return [];
        return allCohorts
            .filter(c => c.id !== myCohort?.id)
            .filter(c => {
                const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase());
                const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
                return matchesSearch && matchesStatus;
            });
    }, [allCohorts, myCohort, searchQuery, statusFilter]);

    const loading = cohortsLoading || admissionLoading || programsLoading;

    if (loading) {
        return (
            <div className="p-8 flex items-center justify-center min-h-screen">
                <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="w-full min-h-screen bg-gray-50/50 p-2 md:p-4 font-body">
            <div className="w-full">
                {/* Hero */}
                <div className="bg-primary text-white p-6 mb-6 border-b border-primary/10 rounded-tl-3xl rounded-br-3xl rounded-tr-none rounded-bl-none shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-accent/20 rounded-full blur-3xl opacity-20" />
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <FolderKanban className="h-8 w-8 bg-accent/20 p-1.5 rounded-lg text-accent" />
                                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Admissions & Intakes</h1>
                            </div>
                            <p className="text-white/80 text-lg font-medium">Apply to an open intake and pay your admission fee to get started.</p>
                        </div>
                        {!myCohort && (
                            <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-tl-2xl rounded-br-2xl p-4 text-center">
                                <p className="text-white/60 text-xs uppercase font-bold tracking-widest mb-1">Your Status</p>
                                <p className="text-white font-bold">No Active Application</p>
                                <p className="text-white/50 text-xs mt-1">Pick an intake below to apply</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-col lg:flex-row gap-4 mb-6 items-end">
                    <div className="relative flex-1 group w-full">
                        <label className="text-xs font-bold text-primary/40 uppercase tracking-widest ml-1 mb-2 block">Search Intake</label>
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary/30 group-focus-within:text-primary transition-colors" />
                            <Input
                                placeholder="Search by intake name..."
                                className="pl-12 h-14 bg-white border-primary/10 rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none shadow-sm text-base font-medium"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="flex flex-col gap-2 w-full lg:w-64">
                        <label className="text-xs font-bold text-primary/40 uppercase tracking-widest ml-1">Status</label>
                        <div className="relative">
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="w-full appearance-none bg-white border border-primary/10 rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none px-4 text-sm font-bold text-primary focus:outline-none focus:ring-2 focus:ring-primary/10 cursor-pointer shadow-sm h-14"
                            >
                                <option value="all">All Stages</option>
                                <option value="Accepting Applications">Accepting Applications</option>
                                <option value="In Review">In Review</option>
                                <option value="Closed">Closed</option>
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/30 pointer-events-none" />
                        </div>
                    </div>
                </div>

                {/* My Active Application */}
                {myCohort && (
                    <div className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex items-center gap-3 mb-4">
                            <CheckCircle className="h-6 w-6 text-green-500" />
                            <h2 className="text-2xl font-bold text-primary">My Active Application</h2>
                        </div>
                        <div className="w-full bg-white shadow-lg border border-green-200 overflow-hidden rounded-tl-2xl rounded-br-2xl">
                            <Table>
                                <TableHeader className="bg-green-500/10 border-b border-green-500/20">
                                    <TableRow className="hover:bg-transparent">
                                        <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest">Intake</TableHead>
                                        <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest text-center">Status</TableHead>
                                        <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest text-center">Program</TableHead>
                                        <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    <TableRow className="hover:bg-green-50/50 bg-green-50/30">
                                        <TableCell className="px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 flex items-center justify-center rounded-tl-lg rounded-br-lg bg-green-500 text-white">
                                                    <CheckCircle className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-primary leading-tight">{myCohort.name}</p>
                                                    <p className="text-[10px] text-green-600 uppercase font-black mt-1">{myCohort.status}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="px-6 py-4 text-center">
                                            <Badge className={cn(
                                                "rounded-tl-sm rounded-br-sm rounded-tr-none rounded-bl-none font-bold text-[9px] uppercase tracking-widest border-none px-3 py-1",
                                                myCohort.admission?.status === 'Admitted' || myCohort.admission?.status === 'Placed' ? 'bg-green-500 text-white' :
                                                    myCohort.admission?.status === 'Rejected' ? 'bg-red-500 text-white' : 'bg-accent text-white'
                                            )}>
                                                {myCohort.admission?.status || 'Applied'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="px-6 py-4">
                                            {myCohort.admission && (
                                                <div className="flex flex-col gap-1.5">
                                                    {myCohort.admission.interestedProgramTitle && (
                                                        <div className="flex items-center gap-1.5 justify-center">
                                                            <span className="text-[9px] font-bold text-primary/40 uppercase tracking-wider">Applied:</span>
                                                            <span className="text-xs text-primary/70">{myCohort.admission.interestedProgramTitle}</span>
                                                        </div>
                                                    )}
                                                    {(myCohort.admission.finalProgramTitle || myCohort.admission.recommendedProgramTitle || myCohort.admission.recommendedProgramId) && (
                                                        <div className="flex items-center gap-1.5 justify-center">
                                                            <span className="text-[9px] font-bold text-green-600/60 uppercase tracking-wider">Placed:</span>
                                                            <span className="text-xs font-bold text-green-600">
                                                                {myCohort.admission.finalProgramTitle || myCohort.admission.recommendedProgramTitle || myCohort.admission.recommendedProgramId}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell className="px-6 py-4 text-right">
                                            {myCohort.admission && (
                                                <Dialog>
                                                    <DialogTrigger asChild>
                                                        <Button size="sm" className="bg-primary text-white hover:bg-primary/90 rounded-tl-md rounded-br-md shadow-lg">
                                                            <Eye className="h-4 w-4 mr-2" /> View Progress
                                                        </Button>
                                                    </DialogTrigger>
                                                    <DialogContent className="sm:max-w-2xl bg-white rounded-tl-3xl rounded-br-3xl rounded-tr-none rounded-bl-none border border-primary/10">
                                                        <DialogHeader>
                                                            <DialogTitle className="text-2xl font-bold text-primary flex items-center gap-2">
                                                                <FolderKanban className="h-6 w-6 text-accent" /> Admission Progress
                                                            </DialogTitle>
                                                        </DialogHeader>
                                                        <AdmissionDetailsDialog admission={myCohort.admission} cohort={myCohort} />
                                                    </DialogContent>
                                                </Dialog>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                )}

                {/* Available Intakes */}
                <div>
                    <div className="flex items-center gap-3 mb-4">
                        <Layers className="h-6 w-6 text-primary" />
                        <h2 className="text-2xl font-bold text-primary">
                            {myCohort ? 'Other Available Intakes' : 'Available Intakes'}
                        </h2>
                    </div>

                    <div className="w-full bg-white shadow-lg border border-primary/10 overflow-hidden rounded-tl-2xl rounded-br-2xl">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-primary/5 border-b border-primary/10">
                                    <TableRow className="hover:bg-transparent">
                                        <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest">Intake Name</TableHead>
                                        <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest text-center">Status</TableHead>
                                        <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest text-center">Programs</TableHead>
                                        <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest text-center">Start Date</TableHead>
                                        <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody className="divide-y divide-primary/10">
                                    {otherCohorts.map((cohort) => {
                                        const count = cohort.programIds?.length || 0;
                                        return (
                                            <TableRow key={cohort.id} className="hover:bg-primary/5 transition-colors group border-primary/10">
                                                <TableCell className="px-6 py-4">
                                                    <div className="flex items-center gap-4">
                                                        <div className={cn(
                                                            "h-10 w-10 flex items-center justify-center rounded-tl-lg rounded-br-lg transition-all",
                                                            cohort.status === 'Accepting Applications'
                                                                ? "bg-accent/10 text-accent group-hover:bg-accent group-hover:text-white"
                                                                : "bg-primary/10 text-primary/40"
                                                        )}>
                                                            <Users className="h-5 w-5" />
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-primary leading-tight">{cohort.name}</p>
                                                            {cohort.description && (
                                                                <p className="text-[10px] text-primary/40 mt-0.5 max-w-xs line-clamp-1">{cohort.description}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="px-6 py-4 text-center">
                                                    <Badge className={cn(
                                                        "rounded-tl-sm rounded-br-sm rounded-tr-none rounded-bl-none font-bold text-[9px] uppercase tracking-widest border-none px-3",
                                                        cohort.status === 'Accepting Applications' ? 'bg-green-500 text-white' :
                                                            cohort.status === 'Closed' ? 'bg-primary/20 text-primary/60' : 'bg-accent text-white'
                                                    )}>
                                                        {cohort.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="px-6 py-4 text-center">
                                                    <span className="font-bold text-primary">{count}</span>
                                                    <span className="text-[10px] text-primary/40 ml-1 font-bold uppercase">program{count !== 1 ? 's' : ''}</span>
                                                </TableCell>
                                                <TableCell className="px-6 py-4 text-center">
                                                    {cohort.startDate ? (
                                                        <span className="text-sm font-bold text-primary">
                                                            {new Date(cohort.startDate).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                        </span>
                                                    ) : (
                                                        <span className="text-primary/30 text-xs font-bold">TBD</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="rounded-tl-md rounded-br-md border-primary/20 text-primary hover:bg-primary/5 font-bold text-[10px] uppercase tracking-widest h-9 px-4"
                                                            asChild
                                                        >
                                                            <Link href={`/l/admissions/${cohort.id}`}>
                                                                <Eye className="h-3.5 w-3.5 mr-1.5" />View
                                                            </Link>
                                                        </Button>
                                                        <ApplyToIntakeDialog cohort={cohort} allPrograms={allPrograms || []} />
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                    {otherCohorts.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-20 text-primary/40 font-bold uppercase tracking-widest">
                                                No intakes found matching your filters
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
