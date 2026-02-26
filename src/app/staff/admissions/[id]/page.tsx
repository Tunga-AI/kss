'use client';
import Link from 'next/link';
import { useState, useMemo, useEffect } from 'react';
import { useParams, notFound, useRouter } from 'next/navigation';
import { useFirestore, useDoc, useCollection } from '@/firebase';
import { doc, collection, query, where } from 'firebase/firestore';
import type { Admission } from '@/lib/admission-types';
import type { LearningCourse } from '@/lib/learning-types';
import type { Cohort } from '@/lib/cohort-types';
import type { Program } from '@/lib/program-types';
import type { AssessmentAttempt } from '@/lib/assessment-types';
import type { User } from '@/lib/user-types';
import { updateAdmission } from '@/lib/admissions';
import { getAdmissionAssessmentAttempt } from '@/lib/assessments';
import { getLearningCoursesByCohort, getOrCreateEnrollment } from '@/lib/learning';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    CheckCircle2,
    XCircle,
    ArrowLeft,
    User as UserIcon,
    Mail,
    Calendar,
    Shield,
    GraduationCap,
    Activity,
    RefreshCw,
    Settings2,
    FileText,
    Target,
    BarChart,
    Users,
    Briefcase,
    BookOpen,
    Award,
    Star,
    ExternalLink
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from "@/lib/utils";

export default function StaffAdmissionReviewPage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const id = Array.isArray(params.id) ? params.id[0] : params.id;
    const firestore = useFirestore();

    const [decision, setDecision] = useState<'Admitted' | 'Rejected'>();
    const [recommendedProgramId, setRecommendedProgramId] = useState('');
    const [recommendedCohortId, setRecommendedCohortId] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [assessmentAttempt, setAssessmentAttempt] = useState<AssessmentAttempt | null>(null);

    const admissionRef = useMemo(() => firestore && id ? doc(firestore, 'admissions', id) : null, [firestore, id]);
    const { data: admission, loading: admissionLoading } = useDoc<Admission>(admissionRef as any);

    const appliedCohortRef = useMemo(() => firestore && admission?.cohortId && admission.cohortId !== 'PENDING_ASSIGNMENT' ? doc(firestore, 'cohorts', admission.cohortId) : null, [firestore, admission?.cohortId]);
    const { data: appliedCohort } = useDoc<Cohort>(appliedCohortRef as any);

    const userRef = useMemo(() => firestore && admission?.userId ? doc(firestore, 'users', admission.userId) : null, [firestore, admission?.userId]);
    const { data: applicantUser } = useDoc<User>(userRef as any);

    const programsQuery = useMemo(() => firestore ? query(collection(firestore, 'programs')) : null, [firestore]);
    const { data: allPrograms, loading: programsLoading } = useCollection<Program>(programsQuery as any);

    const cohortsQuery = useMemo(() => firestore ? query(collection(firestore, 'cohorts'), where('status', '==', 'Accepting Applications')) : null, [firestore]);
    const { data: cohorts, loading: cohortsLoading } = useCollection<Cohort>(cohortsQuery as any);

    const availablePrograms = useMemo(() => {
        if (!allPrograms || !recommendedCohortId) return [];
        const selectedCohort = cohorts?.find(c => c.id === recommendedCohortId);
        if (!selectedCohort || !selectedCohort.programIds) return [];
        return allPrograms.filter(p => selectedCohort.programIds.includes(p.id));
    }, [allPrograms, cohorts, recommendedCohortId]);

    // Load assessment attempt
    useEffect(() => {
        const loadAssessment = async () => {
            if (!firestore || !admission?.id) return;

            try {
                const attempt = await getAdmissionAssessmentAttempt(firestore, admission.id);
                setAssessmentAttempt(attempt);
            } catch (error) {
                console.error('Error loading assessment:', error);
            }
        };

        loadAssessment();
    }, [firestore, admission]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!firestore || !id || !decision) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please make a decision.' });
            return;
        }
        if (decision === 'Admitted' && (!recommendedProgramId || !recommendedCohortId)) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please select both program and cohort for placement.' });
            return;
        }

        setIsSaving(true);
        try {
            const selectedProgram = allPrograms?.find(p => p.id === recommendedProgramId);
            const selectedProgramTitle = selectedProgram?.programName || selectedProgram?.title;
            const selectedCohort = cohorts?.find(c => c.id === recommendedCohortId);

            await updateAdmission(firestore, id, {
                status: decision === 'Admitted' ? 'Placed' : 'Rejected', // Aligning with Place status in Admin
                finalProgramId: decision === 'Admitted' ? recommendedProgramId : undefined,
                finalProgramTitle: decision === 'Admitted' ? selectedProgramTitle : undefined,
                finalCohortId: decision === 'Admitted' ? recommendedCohortId : undefined,
                finalCohortTitle: decision === 'Admitted' ? selectedCohort?.name : undefined,
                recommendedProgramId: decision === 'Admitted' ? recommendedProgramId : undefined,
                recommendedProgramTitle: decision === 'Admitted' ? selectedProgramTitle : undefined,
                cohortId: decision === 'Admitted' ? recommendedCohortId : undefined,
            });

            if (decision === 'Admitted' && admission?.userId && recommendedCohortId && recommendedProgramId) {
                try {
                    const cohortCourses = await getLearningCoursesByCohort(firestore, recommendedCohortId);
                    await Promise.all(cohortCourses.map(course =>
                        getOrCreateEnrollment(
                            firestore,
                            admission.userId,
                            course.id,
                            recommendedCohortId,
                            recommendedProgramId,
                            admission.name,
                            admission.email
                        )
                    ));
                } catch (enrollErr) {
                    console.error('Auto-enrollment error:', enrollErr);
                }
            }

            toast({ title: 'Success', description: 'Decision has been recorded.' });
            router.push('/a/admissions');
        } catch (error) {
            console.error(error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not save the decision.' });
        } finally {
            setIsSaving(false);
        }
    }

    const loading = admissionLoading || programsLoading || cohortsLoading;

    if (loading) {
        return (
            <div className="p-8 flex items-center justify-center min-h-screen">
                <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!admission) notFound();

    return (
        <div className="w-full min-h-screen bg-gray-50/50 p-2 md:p-4 font-body">
            <div className="w-full mx-auto">
                {/* Hero Header Section */}
                <div className="bg-primary text-white p-6 md:p-10 mb-6 border-b border-primary/10 rounded-tl-3xl rounded-br-3xl rounded-tr-none rounded-bl-none shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-accent/20 rounded-full blur-3xl opacity-20" />

                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="flex items-center gap-6">
                            <div className="h-20 w-20 rounded-tl-2xl rounded-br-2xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
                                <UserIcon className="h-10 w-10 text-accent" />
                            </div>
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <FileText className="h-6 w-6 text-accent" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-white/50">Applicant Review Terminal</span>
                                </div>
                                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
                                    {admission.name} <span className="text-white/40 font-mono text-2xl ml-2">#{admission.id}</span>
                                </h1>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <Button
                                variant="outline"
                                className="h-12 border-white/20 text-white hover:bg-white hover:text-primary px-6 rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none transition-all"
                                onClick={() => router.back()}
                            >
                                <ArrowLeft className="h-4 w-4 mr-2" /> Back to Pipeline
                            </Button>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Professional Profile */}
                    {applicantUser?.professionalProfile && (
                        <div className="bg-white border border-primary/10 rounded-tl-2xl rounded-br-2xl shadow-sm overflow-hidden">
                            <div className="p-6 border-b border-primary/5">
                                <h2 className="text-xl font-bold text-primary flex items-center gap-2">
                                    <UserIcon className="h-5 w-5 text-accent" />
                                    Applicant Professional Profile
                                </h2>
                            </div>

                            <div className="p-6 space-y-6">
                                {/* Summary */}
                                {applicantUser.professionalProfile.summary && (
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-primary/40 mb-2">Professional Summary</p>
                                        <p className="text-sm text-primary/80 leading-relaxed bg-primary/5 p-4 rounded-xl">
                                            {applicantUser.professionalProfile.summary}
                                        </p>
                                    </div>
                                )}

                                {/* Skills */}
                                {applicantUser.professionalProfile.skills && applicantUser.professionalProfile.skills.length > 0 && (
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-primary/40 mb-2 flex items-center gap-2">
                                            <Star className="h-3 w-3" /> Skills
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            {applicantUser.professionalProfile.skills.map((skill: string, i: number) => (
                                                <Badge key={i} className="bg-accent/10 text-accent border-none font-bold text-[10px] uppercase tracking-widest px-3 py-1 rounded-tl-md rounded-br-md rounded-tr-none rounded-bl-none">
                                                    {skill}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* Work Experience */}
                                    {applicantUser.professionalProfile.experience && applicantUser.professionalProfile.experience.length > 0 && (
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-primary/40 mb-3 flex items-center gap-2">
                                                <Briefcase className="h-3 w-3" /> Work Experience
                                            </p>
                                            <div className="space-y-3">
                                                {applicantUser.professionalProfile.experience.map((exp: any) => (
                                                    <div key={exp.id} className="p-4 bg-primary/5 rounded-tl-xl rounded-br-xl border border-primary/5">
                                                        <div className="flex items-start justify-between gap-2">
                                                            <div className="flex-1 min-w-0">
                                                                <p className="font-bold text-primary text-sm">{exp.role}</p>
                                                                <p className="text-xs text-primary/60 font-medium">{exp.company}</p>
                                                            </div>
                                                            <span className="text-[10px] text-primary/40 font-bold shrink-0">
                                                                {exp.startDate} – {exp.current ? 'Present' : exp.endDate || ''}
                                                            </span>
                                                        </div>
                                                        {exp.description && (
                                                            <p className="text-xs text-primary/60 mt-2 leading-relaxed">{exp.description}</p>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Education */}
                                    {applicantUser.professionalProfile.education && applicantUser.professionalProfile.education.length > 0 && (
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-primary/40 mb-3 flex items-center gap-2">
                                                <BookOpen className="h-3 w-3" /> Education
                                            </p>
                                            <div className="space-y-3">
                                                {applicantUser.professionalProfile.education.map((edu: any) => (
                                                    <div key={edu.id} className="p-4 bg-primary/5 rounded-tl-xl rounded-br-xl border border-primary/5">
                                                        <div className="flex items-start justify-between gap-2">
                                                            <div className="flex-1 min-w-0">
                                                                <p className="font-bold text-primary text-sm">{edu.degree}</p>
                                                                <p className="text-xs text-primary/60 font-medium">{edu.institution}</p>
                                                                {edu.fieldOfStudy && (
                                                                    <p className="text-[10px] text-accent font-bold uppercase tracking-widest mt-0.5">{edu.fieldOfStudy}</p>
                                                                )}
                                                            </div>
                                                            <span className="text-[10px] text-primary/40 font-bold shrink-0">
                                                                {edu.startDate} – {edu.current ? 'Present' : edu.endDate || ''}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Certifications */}
                                {applicantUser.professionalProfile.certifications && applicantUser.professionalProfile.certifications.length > 0 && (
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-primary/40 mb-3 flex items-center gap-2">
                                            <Award className="h-3 w-3" /> Certifications
                                        </p>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                            {applicantUser.professionalProfile.certifications.map((cert: any) => (
                                                <div key={cert.id} className="p-4 bg-yellow-50 border border-yellow-100 rounded-tl-xl rounded-br-xl">
                                                    <p className="font-bold text-primary text-sm">{cert.name}</p>
                                                    <p className="text-xs text-primary/60 font-medium mt-0.5">{cert.issuer}</p>
                                                    <div className="flex items-center justify-between mt-2">
                                                        <span className="text-[10px] text-primary/40 font-bold">{cert.issueDate}</span>
                                                        {cert.credentialUrl && (
                                                            <a href={cert.credentialUrl} target="_blank" rel="noopener noreferrer" className="text-accent hover:text-accent/80">
                                                                <ExternalLink className="h-3 w-3" />
                                                            </a>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Brief Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        <Card className="bg-white border border-primary/10 rounded-tl-2xl rounded-br-2xl shadow-xl p-6">
                            <p className="text-[10px] font-black uppercase tracking-widest text-primary/40 mb-2">Email</p>
                            <p className="font-bold text-primary flex items-center gap-2 truncate line-clamp-1" title={admission.email}><Mail className="h-4 w-4 text-accent shrink-0" /> {admission.email}</p>
                        </Card>
                        <Card className="bg-white border border-primary/10 rounded-tl-2xl rounded-br-2xl shadow-xl p-6">
                            <p className="text-[10px] font-black uppercase tracking-widest text-primary/40 mb-2">Applied Date</p>
                            <p className="font-bold text-primary flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-accent shrink-0" />
                                {admission.createdAt ? format(admission.createdAt.toDate(), 'PP') : 'N/A'}
                            </p>
                        </Card>
                        <Card className="bg-white border border-primary/10 rounded-tl-2xl rounded-br-2xl shadow-xl p-6">
                            <p className="text-[10px] font-black uppercase tracking-widest text-primary/40 mb-2">Applied Program</p>
                            <p className="font-bold text-primary flex items-center gap-2 truncate line-clamp-1" title={admission.interestedProgramTitle}><GraduationCap className="h-4 w-4 text-accent shrink-0" /> {admission.interestedProgramTitle || 'N/A'}</p>
                        </Card>
                        <Card className="bg-white border border-primary/10 rounded-tl-2xl rounded-br-2xl shadow-xl p-6">
                            <p className="text-[10px] font-black uppercase tracking-widest text-primary/40 mb-2">Applied Intake</p>
                            <p className="font-bold text-primary flex items-center gap-2 truncate line-clamp-1" title={appliedCohort?.name || admission.cohortId}><Users className="h-4 w-4 text-accent shrink-0" /> {appliedCohort?.name || admission.cohortId || 'N/A'}</p>
                        </Card>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* Assessment Results — always show */}
                        <div className="lg:col-span-12 mb-[-1rem]">
                            <Card className="bg-white border border-primary/10 rounded-tl-3xl rounded-br-3xl shadow-xl overflow-hidden">
                                <div className="p-6 border-b border-primary/5 flex items-center gap-2">
                                    <BarChart className="h-5 w-5 text-accent" />
                                    <h2 className="text-xl font-bold text-primary">Assessment Results</h2>
                                </div>

                                {assessmentAttempt ? (
                                    <div className="p-8">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                                            {/* Score */}
                                            <div className={cn(
                                                "text-center p-6 rounded-2xl md:col-span-2",
                                                assessmentAttempt.passed ? "bg-green-50 border border-green-100" : "bg-yellow-50 border border-yellow-100"
                                            )}>
                                                <p className="text-[10px] font-black uppercase tracking-widest text-primary/40 mb-3">Score</p>
                                                <p className={cn(
                                                    "text-6xl font-black tracking-tighter",
                                                    assessmentAttempt.passed ? "text-green-600" : "text-yellow-600"
                                                )}>
                                                    {assessmentAttempt.score.toFixed(0)}%
                                                </p>
                                                <p className="text-xs text-primary/40 mt-3 font-bold">
                                                    {assessmentAttempt.earnedPoints} / {assessmentAttempt.totalPoints} points
                                                </p>
                                            </div>

                                            {/* Details */}
                                            <div className="space-y-3 justify-center flex flex-col md:col-span-2">
                                                <div className="flex flex-col text-sm bg-primary/5 p-4 rounded-xl">
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-primary/40 mb-1">Result Status</span>
                                                    <span className={cn(
                                                        "font-black text-xl",
                                                        assessmentAttempt.passed ? "text-green-600" : "text-yellow-600"
                                                    )}>
                                                        {assessmentAttempt.passed ? '✅ Passed' : '⚠️ Below Threshold'}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between text-sm p-3 bg-primary/5 rounded-xl">
                                                    <span className="text-primary/60 font-medium">Completed</span>
                                                    <span className="font-bold text-primary">
                                                        {assessmentAttempt.completedAt ? format(assessmentAttempt.completedAt.toDate(), 'PPp') : 'N/A'}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between text-sm p-3 bg-primary/5 rounded-xl">
                                                    <span className="text-primary/60 font-medium">Questions Answered</span>
                                                    <span className="font-bold text-primary">{assessmentAttempt.answers.length}</span>
                                                </div>
                                                <div className="flex justify-between text-sm p-3 bg-primary/5 rounded-xl">
                                                    <span className="text-primary/60 font-medium">Assessment</span>
                                                    <span className="font-bold text-primary truncate max-w-[180px] text-right">{assessmentAttempt.assessmentTitle}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="px-8 pb-8 flex justify-end">
                                            <Link
                                                href={`/a/assessments/${assessmentAttempt.assessmentId}/attempts/${assessmentAttempt.id}/report`}
                                                className="inline-flex items-center gap-2 bg-accent text-white font-bold px-5 py-2.5 rounded-tl-xl rounded-br-xl shadow-md hover:bg-accent/90 transition-all text-sm"
                                            >
                                                <BarChart className="h-4 w-4" />
                                                View Full Competency Report
                                            </Link>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-12 flex flex-col items-center justify-center text-center gap-4">
                                        <div className="h-20 w-20 rounded-full bg-primary/5 flex items-center justify-center mb-2">
                                            <FileText className="h-10 w-10 text-primary/20" />
                                        </div>
                                        <p className="text-xl font-black text-primary/30 uppercase tracking-widest">Not Yet Attempted</p>
                                        <p className="text-sm text-primary/40 max-w-sm leading-relaxed">
                                            This learner has not completed an assessment yet.
                                            {admission.status === 'Pending Assessment'
                                                ? ' Their current status is "Pending Assessment" — they should be notified to complete the test.'
                                                : ` Current status: ${admission.status}.`
                                            }
                                        </p>
                                        <div className="mt-2 px-4 py-2 bg-yellow-50 border border-yellow-200 rounded-xl">
                                            <p className="text-xs font-black text-yellow-700 uppercase tracking-widest">⚠️ No Assessment Data Available</p>
                                        </div>
                                    </div>
                                )}
                            </Card>
                        </div>

                        {/* Decision Panel */}
                        <div className="lg:col-span-8">
                            <Card className="bg-white border border-primary/10 rounded-tl-3xl rounded-br-3xl shadow-xl overflow-hidden">
                                <div className="p-8 md:p-10">
                                    <h2 className="text-xl font-bold text-primary mb-8 flex items-center gap-2">
                                        <Shield className="h-5 w-5 text-accent" />
                                        Evaluation & Final Decision
                                    </h2>

                                    <div className="space-y-10">
                                        <div className="space-y-4">
                                            <Label className="text-[10px] uppercase font-black tracking-widest text-primary/40 ml-1">Admission Determination</Label>
                                            <RadioGroup
                                                value={decision}
                                                onValueChange={(v: 'Admitted' | 'Rejected') => setDecision(v)}
                                                className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                                            >
                                                <div className={cn(
                                                    "border-2 rounded-2xl p-6 cursor-pointer transition-all flex items-center justify-between group",
                                                    decision === 'Admitted' ? "border-green-500 bg-green-50" : "border-primary/5 hover:border-primary/20"
                                                )} onClick={() => setDecision('Admitted')}>
                                                    <div className="flex items-center gap-4">
                                                        <CheckCircle2 className={cn("h-6 w-6", decision === 'Admitted' ? "text-green-500" : "text-primary/10 group-hover:text-primary/20")} />
                                                        <div>
                                                            <p className="font-black uppercase text-[10px] tracking-widest text-primary/40">Status: Grant</p>
                                                            <p className="font-bold text-primary">Issue Admission</p>
                                                        </div>
                                                    </div>
                                                    <RadioGroupItem value="Admitted" id="admitted" className="sr-only" />
                                                </div>

                                                <div className={cn(
                                                    "border-2 rounded-2xl p-6 cursor-pointer transition-all flex items-center justify-between group",
                                                    decision === 'Rejected' ? "border-accent bg-accent/5" : "border-primary/5 hover:border-primary/20"
                                                )} onClick={() => setDecision('Rejected')}>
                                                    <div className="flex items-center gap-4">
                                                        <XCircle className={cn("h-6 w-6", decision === 'Rejected' ? "text-accent" : "text-primary/10 group-hover:text-primary/20")} />
                                                        <div>
                                                            <p className="font-black uppercase text-[10px] tracking-widest text-primary/40">Status: Decline</p>
                                                            <p className="font-bold text-primary">Reject Application</p>
                                                        </div>
                                                    </div>
                                                    <RadioGroupItem value="Rejected" id="rejected" className="sr-only" />
                                                </div>
                                            </RadioGroup>
                                        </div>

                                        {decision === 'Admitted' && (
                                            <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
                                                <div className="space-y-4">
                                                    <Label htmlFor="cohort" className="text-[10px] uppercase font-black tracking-widest text-primary/40">Select Intake / Cohort</Label>
                                                    <Select value={recommendedCohortId} onValueChange={(val) => { setRecommendedCohortId(val); setRecommendedProgramId(''); }} required>
                                                        <SelectTrigger id="cohort" className="h-14 bg-primary/5 border-primary/10 rounded-tl-xl rounded-br-xl font-bold" disabled={cohortsLoading}>
                                                            <div className="flex items-center gap-2">
                                                                <Users className="h-4 w-4 text-accent" />
                                                                <SelectValue placeholder="Choose Cohort" />
                                                            </div>
                                                        </SelectTrigger>
                                                        <SelectContent className="rounded-xl border-primary/10 shadow-2xl">
                                                            {cohorts?.map(c => <SelectItem key={c.id} value={c.id} className="font-bold">{c.name}</SelectItem>)}
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                {recommendedCohortId && (
                                                    <div className="space-y-4">
                                                        <Label htmlFor="program" className="text-[10px] uppercase font-black tracking-widest text-primary/40">Approve / Select Program (Curriculum)</Label>
                                                        <Select value={recommendedProgramId} onValueChange={setRecommendedProgramId} required>
                                                            <SelectTrigger id="program" className="h-14 bg-primary/5 border-primary/10 rounded-tl-xl rounded-br-xl font-bold">
                                                                <div className="flex items-center gap-2">
                                                                    <Target className="h-4 w-4 text-accent" />
                                                                    <SelectValue placeholder="Choose Program" />
                                                                </div>
                                                            </SelectTrigger>
                                                            <SelectContent className="rounded-xl border-primary/10 shadow-2xl">
                                                                {availablePrograms.map(p => <SelectItem key={p.id} value={p.id} className="font-bold">{p.programName || p.title}</SelectItem>)}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    <div className="mt-12 pt-8 border-t border-primary/5">
                                        <Button
                                            type="submit"
                                            disabled={isSaving || !decision}
                                            className="w-full bg-primary hover:bg-primary/90 text-white h-14 rounded-tl-2xl rounded-br-2xl rounded-tr-none rounded-bl-none font-black text-[10px] uppercase tracking-widest shadow-xl transition-all active:scale-95"
                                        >
                                            {isSaving ? (
                                                <><RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Records Committing...</>
                                            ) : (
                                                "Finalize Decision & Notify Applicant"
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        </div>

                        {/* Audit Sidebar */}
                        <div className="lg:col-span-4 space-y-8">
                            <Card className="bg-primary text-white border border-primary/10 rounded-tl-3xl rounded-br-3xl shadow-xl p-8 relative overflow-hidden">
                                <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-accent/20 rounded-full blur-3xl opacity-20" />

                                <h2 className="text-xl font-bold mb-8 flex items-center gap-2">
                                    <Settings2 className="h-5 w-5 text-accent" />
                                    Pipeline Audit
                                </h2>

                                <div className="space-y-6 relative z-10">
                                    <div className="pb-4 border-b border-white/10">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">Current State</p>
                                        <Badge className="bg-accent/20 text-accent border-none">{admission.status}</Badge>
                                    </div>
                                    <div className="pb-4 border-b border-white/10">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">Applicant ID</p>
                                        <p className="font-mono text-xl opacity-60">#{id}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">Integrity Check</p>
                                        <p className="text-[10px] opacity-60 italic leading-relaxed">Decision will trigger automated email dispatch and system log entry.</p>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}

function Badge({ children, variant = "default", className }: any) {
    return (
        <span className={cn(
            "px-2 py-1 rounded-sm text-[8px] uppercase font-black tracking-widest inline-flex items-center",
            variant === "default" ? "bg-accent text-white" : "border text-white",
            className
        )}>
            {children}
        </span>
    );
}
