'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore } from '@/firebase';
import { collection, query, where, getDocs, limit, orderBy, doc, getDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Link from 'next/link';
import { Loader2, Clock, CheckCircle, AlertCircle, FileText, ArrowLeft, TrendingUp, Award, Calendar, RefreshCw, ArrowRight, Layers, BarChart2, Sparkles } from 'lucide-react';
import type { Admission } from '@/lib/admission-types';
import type { Assessment, AssessmentAttempt } from '@/lib/assessment-types';
import { getAssessmentByProgramId, startAssessment, submitAssessment, getUserAssessmentAttempts } from '@/lib/assessments';
import { updateAdmission } from '@/lib/admissions';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export default function LearnerAssessmentPage() {
    const router = useRouter();
    const { user, loading: userLoading } = useUser();
    const firestore = useFirestore();

    const [loading, setLoading] = useState(true);
    const [admission, setAdmission] = useState<Admission | null>(null);
    const [assessment, setAssessment] = useState<Assessment | null>(null);
    const [allAssessments, setAllAssessments] = useState<Assessment[]>([]);
    const [attemptId, setAttemptId] = useState<string | null>(null);
    const [pastAttempts, setPastAttempts] = useState<AssessmentAttempt[]>([]);
    const [showTakeAssessment, setShowTakeAssessment] = useState(false);

    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<string, string | number>>({});
    const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [completed, setCompleted] = useState(false);
    const [score, setScore] = useState<number | null>(null);
    const [starting, setStarting] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            if (!user?.id || !firestore) return;

            try {
                // Load all past attempts for this user
                const attempts = await getUserAssessmentAttempts(firestore, user.id);
                setPastAttempts(attempts);

                // Load all active assessments
                const assessmentsSnapshot = await getDocs(query(collection(firestore, 'assessments'), orderBy('createdAt', 'desc')));
                const assessmentsList = assessmentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Assessment));
                setAllAssessments(assessmentsList);

                // Load admission
                const admissionsSnapshot = await getDocs(query(
                    collection(firestore, 'admissions'),
                    where('userId', '==', user.id),
                    limit(1)
                ));

                if (!admissionsSnapshot.empty) {
                    const admissionData = {
                        id: admissionsSnapshot.docs[0].id,
                        ...admissionsSnapshot.docs[0].data()
                    } as Admission;
                    setAdmission(admissionData);

                    // Only try to load the assessment if admission is pending assessment
                    if (admissionData.status === 'Pending Assessment' && !admissionData.assessmentCompleted) {
                        let assessmentData: Assessment | null = null;

                        // First try to fetch the assessment specific to the assigned cohort
                        if (admissionData.cohortId) {
                            try {
                                const cohortDocRef = doc(firestore, 'cohorts', admissionData.cohortId);
                                const cohortDocSnap = await getDoc(cohortDocRef);
                                if (cohortDocSnap.exists()) {
                                    const cohortData = cohortDocSnap.data();
                                    const pId = admissionData.interestedProgramId || '';

                                    // Get assessment info from programSettings or legacy field
                                    const targetAssessmentId = cohortData.programSettings?.[pId]?.assessmentId || cohortData.assessmentId;

                                    if (targetAssessmentId) {
                                        const assessmentDocRef = doc(firestore, 'assessments', targetAssessmentId);
                                        const assessmentDocSnap = await getDoc(assessmentDocRef);
                                        if (assessmentDocSnap.exists()) {
                                            assessmentData = { id: assessmentDocSnap.id, ...assessmentDocSnap.data() } as Assessment;
                                        }
                                    }
                                }
                            } catch (err) {
                                console.error('Error fetching cohort assessment:', err);
                            }
                        }

                        // Fallback to finding active assessment by program id if cohort fetch didn't yield an assessment
                        if (!assessmentData && admissionData.interestedProgramId) {
                            assessmentData = await getAssessmentByProgramId(firestore, admissionData.interestedProgramId);
                        }

                        if (assessmentData) {
                            setAssessment(assessmentData);
                            if (assessmentData.timeLimit) {
                                setTimeRemaining(assessmentData.timeLimit * 60);
                            }
                            setShowTakeAssessment(true);
                        }
                    }
                }
            } catch (error) {
                console.error('Error loading assessment data:', error);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [user, firestore]);

    const handleStartAssessment = async () => {
        if (!firestore || !assessment || !admission || !user?.id) return;

        setStarting(true);
        try {
            const id = await startAssessment(firestore, {
                assessmentId: assessment.id,
                assessmentTitle: assessment.title,
                userId: user.id,
                userName: user.name,
                userEmail: user.email,
                admissionId: admission.id,
                programId: assessment.programId || admission.interestedProgramId || '',
                programTitle: assessment.programTitle || admission.interestedProgramTitle || '',
            });
            setAttemptId(id);
        } catch (error) {
            console.error('Error starting assessment:', error);
            alert('Failed to start assessment. Please try again.');
        } finally {
            setStarting(false);
        }
    };

    // Timer countdown
    useEffect(() => {
        if (timeRemaining === null || timeRemaining <= 0 || !attemptId) return;

        const timer = setInterval(() => {
            setTimeRemaining(prev => {
                if (prev === null || prev <= 1) {
                    handleSubmitAssessment();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [timeRemaining, attemptId]);

    const handleAnswerChange = (questionId: string, answer: string | number) => {
        setAnswers(prev => ({ ...prev, [questionId]: answer }));
    };

    const handleSubmitAssessment = async () => {
        if (!firestore || !assessment || !attemptId || !admission) return;

        setSubmitting(true);
        try {
            let earnedPoints = 0;
            let totalPoints = 0;

            const answerArray = assessment.questions.map((q: any) => {
                totalPoints += q.points;
                const userAnswer = answers[q.id];
                const correctAnswer = q.correctAnswer ?? q.correctOptionId;
                if (correctAnswer !== undefined && userAnswer === correctAnswer) {
                    earnedPoints += q.points;
                }
                return { questionId: q.id, answer: userAnswer || '' };
            });

            const scorePercentage = totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0;
            const passed = scorePercentage >= assessment.passingScore;

            await submitAssessment(firestore, attemptId, answerArray, scorePercentage, totalPoints, earnedPoints, passed);

            await updateAdmission(firestore, admission.id, {
                assessmentCompleted: true,
                assessmentAttemptId: attemptId,
                assessmentScore: scorePercentage,
                assessmentPassed: passed,
                status: 'Pending Review',
            });

            setScore(scorePercentage);
            setCompleted(true);
            setShowTakeAssessment(false);
            // Refresh attempts
            const updatedAttempts = await getUserAssessmentAttempts(firestore, user!.id);
            setPastAttempts(updatedAttempts);
        } catch (error) {
            console.error('Error submitting assessment:', error);
        } finally {
            setSubmitting(false);
        }
    };

    if (userLoading || loading) {
        return (
            <div className="p-8 flex items-center justify-center min-h-screen">
                <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    // ── Active quiz view ────────────────────────────────────────────────────────
    if (attemptId && assessment && assessment.questions && assessment.questions.length > 0) {
        const currentQuestion = assessment.questions[currentQuestionIndex];
        const progress = ((currentQuestionIndex + 1) / assessment.questions.length) * 100;
        const allAnswered = assessment.questions.every((q: any) => answers[q.id] !== undefined);
        const answeredCount = assessment.questions.filter((q: any) => answers[q.id] !== undefined).length;

        return (
            <div className="w-full min-h-screen bg-gray-50/50 p-2 md:p-4 font-body">
                <div className="w-full max-w-7xl mx-auto">
                    <div className="bg-white border border-primary/10 rounded-tl-2xl rounded-br-2xl shadow-lg p-6 mb-6 sticky top-4 z-10">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center">
                                        <span className="text-white font-bold">{currentQuestionIndex + 1}</span>
                                    </div>
                                    <div>
                                        <h1 className="text-xl md:text-2xl font-bold text-primary">{assessment.title}</h1>
                                        <p className="text-sm text-primary/60 font-medium">
                                            Question {currentQuestionIndex + 1} of {assessment.questions.length} • {answeredCount}/{assessment.questions.length} Answered
                                        </p>
                                    </div>
                                </div>
                                <div className="mt-3 bg-primary/10 rounded-full h-3 overflow-hidden">
                                    <div className="bg-gradient-to-r from-primary to-accent h-3 rounded-full transition-all duration-300 ease-out" style={{ width: `${progress}%` }} />
                                </div>
                            </div>
                            {timeRemaining !== null && (
                                <div className={`flex items-center gap-3 px-6 py-3 rounded-tl-xl rounded-br-xl ${timeRemaining < 300 ? 'bg-red-50 border-2 border-red-500' : 'bg-primary/5 border-2 border-primary/20'}`}>
                                    <Clock className={`h-6 w-6 ${timeRemaining < 300 ? 'text-red-600 animate-pulse' : 'text-primary'}`} />
                                    <div>
                                        <p className="text-xs font-bold text-primary/60 uppercase tracking-wider">Time Remaining</p>
                                        <p className={`text-2xl font-black ${timeRemaining < 300 ? 'text-red-600' : 'text-primary'}`}>
                                            {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <Card className="border border-primary/10 shadow-2xl rounded-tl-3xl rounded-br-3xl overflow-hidden mb-6">
                        <CardHeader className="bg-gradient-to-br from-primary/5 to-accent/5 border-b border-primary/10 p-8">
                            <div className="flex items-start justify-between gap-4">
                                <CardTitle className="text-2xl font-bold text-primary leading-relaxed flex-1">
                                    {(currentQuestion as any).question ?? (currentQuestion as any).text ?? ''}
                                </CardTitle>
                                <div className="bg-accent/10 px-4 py-2 rounded-tl-lg rounded-br-lg">
                                    <p className="text-xs font-bold text-accent uppercase tracking-wider">Points</p>
                                    <p className="text-2xl font-black text-accent">{currentQuestion.points}</p>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-8">
                            <div className="space-y-3">
                                {(currentQuestion.type === 'multiple-choice') && currentQuestion.options && (
                                    <RadioGroup value={answers[currentQuestion.id]?.toString()} onValueChange={(value) => handleAnswerChange(currentQuestion.id, value)} className="space-y-3">
                                        {currentQuestion.options.map((option: any) => {
                                            const optionId = typeof option === 'string' ? option : option.id;
                                            const optionText = typeof option === 'string' ? option : option.text;
                                            const isSelected = answers[currentQuestion.id] === optionId;
                                            return (
                                                <div key={optionId} className={`flex items-center space-x-4 p-5 border-2 rounded-tl-xl rounded-br-xl transition-all cursor-pointer ${isSelected ? 'border-accent bg-accent/5 shadow-md' : 'border-primary/10 hover:border-primary/30 hover:bg-primary/5'}`} onClick={() => handleAnswerChange(currentQuestion.id, optionId)}>
                                                    <RadioGroupItem value={optionId} id={`option-${optionId}`} className="h-5 w-5" />
                                                    <Label htmlFor={`option-${optionId}`} className="flex-1 cursor-pointer text-base font-medium text-primary">{optionText}</Label>
                                                    {isSelected && <CheckCircle className="h-5 w-5 text-accent" />}
                                                </div>
                                            );
                                        })}
                                    </RadioGroup>
                                )}
                                {(currentQuestion.type === 'true-false') && (
                                    <RadioGroup value={answers[currentQuestion.id]?.toString()} onValueChange={(value) => handleAnswerChange(currentQuestion.id, value)} className="space-y-3">
                                        {['True', 'False'].map((option) => {
                                            const isSelected = answers[currentQuestion.id] === option;
                                            return (
                                                <div key={option} className={`flex items-center space-x-4 p-5 border-2 rounded-tl-xl rounded-br-xl transition-all cursor-pointer ${isSelected ? 'border-accent bg-accent/5 shadow-md' : 'border-primary/10 hover:border-primary/30 hover:bg-primary/5'}`} onClick={() => handleAnswerChange(currentQuestion.id, option)}>
                                                    <RadioGroupItem value={option} id={option.toLowerCase()} className="h-5 w-5" />
                                                    <Label htmlFor={option.toLowerCase()} className="flex-1 cursor-pointer text-base font-medium text-primary">{option}</Label>
                                                    {isSelected && <CheckCircle className="h-5 w-5 text-accent" />}
                                                </div>
                                            );
                                        })}
                                    </RadioGroup>
                                )}
                            </div>
                            {!allAnswered && currentQuestionIndex === assessment.questions.length - 1 && (
                                <Alert className="mt-6 border-red-200 bg-red-50">
                                    <AlertCircle className="h-5 w-5 text-red-600" />
                                    <AlertDescription className="text-red-800 font-medium">
                                        <strong>Please answer all questions</strong> before submitting. You have {assessment.questions.length - answeredCount} unanswered question(s).
                                    </AlertDescription>
                                </Alert>
                            )}
                            <div className="flex justify-between items-center pt-8 mt-8 border-t border-primary/10">
                                <Button variant="outline" onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))} disabled={currentQuestionIndex === 0} className="h-12 px-8 rounded-tl-xl rounded-br-xl font-bold">
                                    <ArrowLeft className="h-4 w-4 mr-2" /> Previous
                                </Button>
                                {currentQuestionIndex === assessment.questions.length - 1 ? (
                                    <Button onClick={handleSubmitAssessment} disabled={!allAnswered || submitting} className="h-12 px-8 rounded-tl-xl rounded-br-xl font-bold bg-accent hover:bg-accent/90 text-white shadow-lg">
                                        {submitting ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Submitting...</> : <><CheckCircle className="mr-2 h-5 w-5" /> Submit Assessment</>}
                                    </Button>
                                ) : (
                                    <Button onClick={() => setCurrentQuestionIndex(prev => Math.min(assessment.questions.length - 1, prev + 1))} className="h-12 px-8 rounded-tl-xl rounded-br-xl font-bold bg-primary hover:bg-primary/90 text-white">
                                        Next Question <ArrowLeft className="h-4 w-4 ml-2 rotate-180" />
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border border-primary/10 shadow-lg rounded-tl-2xl rounded-br-2xl overflow-hidden">
                        <CardHeader className="bg-primary/5 border-b border-primary/10">
                            <CardTitle className="text-base font-bold text-primary">Quick Navigation</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                                {assessment.questions.map((q: any, index: number) => {
                                    const isAnswered = answers[q.id] !== undefined;
                                    const isCurrent = index === currentQuestionIndex;
                                    return (
                                        <button key={q.id} onClick={() => setCurrentQuestionIndex(index)} className={`h-10 w-full rounded-lg font-bold transition-all ${isCurrent ? 'bg-accent text-white shadow-md scale-110' : isAnswered ? 'bg-green-500 text-white hover:bg-green-600' : 'bg-primary/10 text-primary hover:bg-primary/20'}`}>
                                            {index + 1}
                                        </button>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    // ── Post-submit completion view ──────────────────────────────────────────────
    if (completed && score !== null) {
        const passingScore = assessment?.passingScore || 70;
        const passed = score >= passingScore;
        return (
            <div className="w-full min-h-screen bg-gray-50/50 p-2 md:p-4 font-body">
                <div className="w-full max-w-3xl mx-auto">
                    <div className="bg-white border border-primary/10 rounded-tl-3xl rounded-br-3xl shadow-2xl overflow-hidden">
                        <div className={cn(`p-8 md:p-12 text-white relative overflow-hidden`, passed ? 'bg-gradient-to-br from-green-500 to-emerald-600' : 'bg-gradient-to-br from-primary to-primary/80')}>
                            <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
                            <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-60 h-60 bg-white/5 rounded-full blur-2xl" />
                            <div className="relative z-10 text-center">
                                <div className="h-24 w-24 rounded-full mx-auto mb-5 flex items-center justify-center bg-white/20 backdrop-blur-sm shadow-xl">
                                    {passed ? <Award className="h-14 w-14 text-white" /> : <BarChart2 className="h-14 w-14 text-white" />}
                                </div>
                                <div className="inline-flex items-center gap-2 bg-white/20 px-4 py-1.5 rounded-full mb-4">
                                    <Sparkles className="h-3.5 w-3.5" />
                                    <span className="text-xs font-black uppercase tracking-widest">Report Ready</span>
                                </div>
                                <h1 className="text-3xl md:text-4xl font-black mb-2">Your Results Are Ready!</h1>
                                <p className="text-white/80 text-base mb-6">
                                    {passed ? 'Congratulations — you have met the passing threshold.' : 'Assessment complete. View your full report for detailed feedback.'}
                                </p>
                                <div className="inline-flex flex-col items-center bg-white/20 backdrop-blur-sm rounded-tl-2xl rounded-br-2xl px-10 py-5 gap-2">
                                    <p className="text-white/60 text-xs font-black uppercase tracking-widest mb-1">Your Score</p>
                                    <p className="text-6xl md:text-7xl font-black text-white leading-none">{score.toFixed(0)}%</p>
                                    <div className={cn('mt-1 px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest', passed ? 'bg-white text-green-600' : 'bg-white/30 text-white')}>
                                        {passed ? '✓ Passed' : `⚠ Below ${passingScore}% threshold`}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="p-8 md:p-10 flex flex-col sm:flex-row gap-4">
                            <button
                                onClick={() => router.push('/dashboard/admissions')}
                                className="flex-1 inline-flex items-center justify-center gap-2 bg-accent hover:bg-accent/90 text-white rounded-tl-xl rounded-br-xl font-bold h-12 shadow-lg transition-all"
                            >
                                <BarChart2 className="h-5 w-5" />
                                View Admission Status
                            </button>
                            <button
                                onClick={() => setCompleted(false)}
                                className="flex-1 inline-flex items-center justify-center gap-2 border border-primary/20 text-primary hover:bg-primary/5 rounded-tl-xl rounded-br-xl font-bold h-12 transition-all"
                            >
                                Back to Assessments
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ── Main page: history + optional pending assessment card ───────────────────
    const pendingAssessment = showTakeAssessment && assessment && !attemptId;
    const passedCount = pastAttempts.filter(a => a.passed).length;

    return (
        <div className="w-full min-h-screen bg-gray-50/50 p-2 md:p-4 font-body">
            <div className="w-full">
                {/* Hero Section */}
                <div className="bg-primary text-white p-6 mb-6 border-b border-primary/10 rounded-tl-3xl rounded-br-3xl rounded-tr-none rounded-bl-none shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-accent/20 rounded-full blur-3xl opacity-20" />

                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <FileText className="h-8 w-8 bg-accent/20 p-1.5 rounded-lg text-accent" />
                                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">My Assessments</h1>
                            </div>
                            <p className="text-white/80 text-lg font-medium">Track your admission assessments and results.</p>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="bg-white/10 px-6 py-3 rounded-tl-xl rounded-br-xl backdrop-blur-sm border border-white/10">
                                <p className="text-2xl font-bold">{pastAttempts.length}</p>
                                <p className="text-[10px] uppercase font-black tracking-widest text-white/60">Taken</p>
                            </div>
                            <div className="bg-white/10 px-6 py-3 rounded-tl-xl rounded-br-xl backdrop-blur-sm border border-white/10">
                                <p className="text-2xl font-bold">{passedCount}</p>
                                <p className="text-[10px] uppercase font-black tracking-widest text-white/60">Passed</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Pending Assessment Action Row */}
                {pendingAssessment && (
                    <div className="mb-4 bg-accent/5 border-2 border-accent/30 rounded-tl-2xl rounded-br-2xl rounded-tr-none rounded-bl-none p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
                        <div className="flex items-start gap-4">
                            <div className="h-10 w-10 rounded-tl-lg rounded-br-lg bg-accent/10 flex items-center justify-center shrink-0">
                                <FileText className="h-5 w-5 text-accent" />
                            </div>
                            <div>
                                <p className="font-bold text-primary leading-tight">{assessment!.title}</p>
                                <p className="text-[10px] text-primary/40 uppercase font-black mt-1">
                                    {assessment!.questions.length} questions · {assessment!.timeLimit ? `${assessment!.timeLimit} min` : 'No time limit'} · Pass at {assessment!.passingScore}%
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                            <Badge className="bg-accent/10 text-accent border-none font-black text-[9px] uppercase tracking-widest">Action Required</Badge>
                            <Button asChild className="bg-accent hover:bg-accent/90 text-white rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none font-bold h-10 px-6 shadow-none text-[10px] uppercase tracking-widest">
                                <Link href={`/dashboard/assessment/pending`}>
                                    <FileText className="h-3.5 w-3.5 mr-2" /> Start Assessment <ArrowRight className="h-3.5 w-3.5 ml-2" />
                                </Link>
                            </Button>
                        </div>
                    </div>
                )}

                {/* Available Assessments Table */}
                <div className="mb-10 w-full bg-white shadow-lg border border-primary/10 overflow-hidden rounded-tl-2xl rounded-br-2xl rounded-tr-none rounded-bl-none">
                    <div className="bg-primary/5 p-4 border-b border-primary/10">
                        <h2 className="font-bold text-primary flex items-center gap-2">
                            <Layers className="h-5 w-5 text-accent" />
                            Available Assessments
                        </h2>
                    </div>
                    <div className="overflow-x-auto">
                        <Table className="w-full">
                            <TableHeader className="bg-white border-b border-primary/10">
                                <TableRow className="hover:bg-transparent">
                                    <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest">Assessment Title</TableHead>
                                    <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest text-center">Questions</TableHead>
                                    <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest text-center">Time Limit</TableHead>
                                    <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody className="divide-y divide-primary/10">
                                {allAssessments.length > 0 ? (
                                    allAssessments.map((a) => (
                                        <TableRow key={a.id} className="hover:bg-primary/5 transition-colors group border-primary/10">
                                            <TableCell className="px-6 py-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-10 w-10 flex items-center justify-center rounded-tl-lg rounded-br-lg bg-primary/10 text-primary/40 group-hover:bg-accent group-hover:text-white transition-all">
                                                        <FileText className="h-5 w-5" />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-primary leading-tight">{a.title}</p>
                                                        <p className="text-xs text-primary/60 mt-0.5 line-clamp-1">{a.description}</p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="px-6 py-4 text-center">
                                                <span className="font-bold text-primary">{a.questions?.length || 0}</span>
                                            </TableCell>
                                            <TableCell className="px-6 py-4 text-center">
                                                <span className="text-xs font-bold text-primary/60">{a.timeLimit ? `${a.timeLimit} min` : 'None'}</span>
                                            </TableCell>
                                            <TableCell className="px-6 py-4 text-right">
                                                <Button
                                                    asChild
                                                    size="sm"
                                                    className="h-8 rounded-tl-md rounded-br-md rounded-tr-none rounded-bl-none font-bold bg-accent hover:bg-accent/90 text-white shadow-none text-[10px] uppercase tracking-widest px-4"
                                                >
                                                    <Link href={`/dashboard/assessment/take/${a.id}`}>
                                                        Take Test <ArrowRight className="h-3 w-3 ml-2" />
                                                    </Link>
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-10">
                                            <p className="text-primary/40 font-bold uppercase tracking-widest text-xs">No assessments available</p>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>

                {/* Assessment History Table */}
                <div className="w-full bg-white shadow-lg border border-primary/10 overflow-hidden rounded-tl-2xl rounded-br-2xl rounded-tr-none rounded-bl-none">
                    <div className="overflow-x-auto">
                        <Table className="w-full">
                            <TableHeader className="bg-primary/5 border-b border-primary/10">
                                <TableRow className="hover:bg-transparent">
                                    <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest">Assessment</TableHead>
                                    <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest">Program</TableHead>
                                    <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest text-center">Score</TableHead>
                                    <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest text-center">Points</TableHead>
                                    <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest text-center">Status</TableHead>
                                    <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest">Date</TableHead>
                                    <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody className="divide-y divide-primary/10">
                                {pastAttempts.length > 0 ? (
                                    pastAttempts.map((attempt) => (
                                        <TableRow key={attempt.id} className="hover:bg-primary/5 transition-colors group border-primary/10">
                                            <TableCell className="px-6 py-4">
                                                <div className="flex items-center gap-4">
                                                    <div className={cn(
                                                        "h-10 w-10 flex items-center justify-center rounded-tl-lg rounded-br-lg transition-all",
                                                        attempt.passed
                                                            ? "bg-green-100 text-green-600 group-hover:bg-green-500 group-hover:text-white"
                                                            : "bg-primary/10 text-primary/40 group-hover:bg-accent group-hover:text-white"
                                                    )}>
                                                        {attempt.passed ? <Award className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-primary leading-tight">{attempt.assessmentTitle}</p>
                                                        <p className="text-[10px] text-primary/40 uppercase font-black mt-0.5">Admission Assessment</p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="px-6 py-4">
                                                <p className="text-sm font-medium text-primary/80">{attempt.programTitle || '—'}</p>
                                            </TableCell>
                                            <TableCell className="px-6 py-4 text-center">
                                                <span className={cn(
                                                    "text-xl font-black",
                                                    attempt.passed ? "text-green-600" : "text-primary"
                                                )}>
                                                    {attempt.score.toFixed(0)}%
                                                </span>
                                            </TableCell>
                                            <TableCell className="px-6 py-4 text-center">
                                                <span className="text-sm font-bold text-primary/80">{attempt.earnedPoints}/{attempt.totalPoints}</span>
                                            </TableCell>
                                            <TableCell className="px-6 py-4 text-center">
                                                <Badge variant="outline" className={cn(
                                                    "rounded-tl-sm rounded-br-sm rounded-tr-none rounded-bl-none font-bold text-[9px] uppercase tracking-widest px-3 py-1 border",
                                                    attempt.passed
                                                        ? "bg-green-100 text-green-700 border-green-200"
                                                        : "bg-primary/5 text-primary/60 border-primary/20"
                                                )}>
                                                    {attempt.passed ? 'Passed' : 'Below Pass'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="px-6 py-4">
                                                <div className="flex items-center gap-2 text-xs text-primary/70 font-medium">
                                                    <Calendar className="h-3 w-3 text-accent" />
                                                    {attempt.completedAt
                                                        ? format(attempt.completedAt.toDate(), 'MMM d, yyyy')
                                                        : '—'}
                                                </div>
                                            </TableCell>
                                            <TableCell className="px-6 py-4 text-right">
                                                <Link
                                                    href={`/dashboard/assessment/${attempt.assessmentId}/report/${attempt.id}`}
                                                    className="inline-flex items-center gap-1.5 h-8 px-4 rounded-tl-md rounded-br-md rounded-tr-none rounded-bl-none font-bold text-[10px] uppercase tracking-widest bg-accent/10 text-accent hover:bg-accent hover:text-white transition-all"
                                                >
                                                    <BarChart2 className="h-3.5 w-3.5" />
                                                    View Report
                                                </Link>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-20">
                                            <div className="flex flex-col items-center gap-2">
                                                <FileText className="h-12 w-12 text-primary/10" />
                                                <p className="text-primary/40 font-bold uppercase tracking-widest text-xs">No assessments taken yet</p>
                                                {!admission && (
                                                    <Button variant="outline" size="sm" asChild className="mt-4 rounded-tl-lg rounded-br-lg rounded-tr-none rounded-bl-none">
                                                        <a href="/l/admissions">Go to Admissions</a>
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </div>
        </div>
    );
}
