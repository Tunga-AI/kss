'use client';

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, RefreshCw, CheckCircle, XCircle, FileText, Award, Calendar, Clock, TrendingUp, AlertCircle, Loader2, BarChart2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useUser, useFirestore } from '@/firebase';
import { collection, query, where, getDocs, doc, getDoc, limit } from 'firebase/firestore';
import type { Assessment, AssessmentAttempt } from '@/lib/assessment-types';
import type { Admission } from '@/lib/admission-types';
import { getAssessmentByProgramId, startAssessment, submitAssessment } from '@/lib/assessments';
import { updateAdmission } from '@/lib/admissions';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export default function AssessmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const { user, loading: userLoading } = useUser();
    const firestore = useFirestore();

    const [loading, setLoading] = useState(true);

    // For review mode
    const [attempt, setAttempt] = useState<AssessmentAttempt | null>(null);
    const [assessment, setAssessment] = useState<Assessment | null>(null);

    // For pending / take-quiz mode
    const [admission, setAdmission] = useState<Admission | null>(null);
    const [attemptId, setAttemptId] = useState<string | null>(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<string, string | number>>({});
    const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [completed, setCompleted] = useState(false);
    const [score, setScore] = useState<number | null>(null);
    const [starting, setStarting] = useState(false);

    const isPendingMode = id === 'pending';

    useEffect(() => {
        const loadData = async () => {
            if (!user?.id || !firestore) return;

            try {
                if (isPendingMode) {
                    // Load admission and assessment to take
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

                        if (admissionData.status === 'Pending Assessment' && !admissionData.assessmentCompleted) {
                            const assessmentData = admissionData.interestedProgramId
                                ? await getAssessmentByProgramId(firestore, admissionData.interestedProgramId)
                                : null;
                            if (assessmentData) {
                                setAssessment(assessmentData);
                                if (assessmentData.timeLimit) {
                                    setTimeRemaining(assessmentData.timeLimit * 60);
                                }
                            }
                        }
                    }
                } else {
                    // Load attempt by ID — redirect to the report page
                    const attemptRef = doc(firestore, 'assessment_attempts', id);
                    const attemptSnap = await getDoc(attemptRef);

                    if (attemptSnap.exists()) {
                        const attemptData = { id: attemptSnap.id, ...attemptSnap.data() } as AssessmentAttempt;
                        // Redirect straight to the report page for this attempt
                        router.replace(`/dashboard/assessment/${attemptData.assessmentId}/report/${id}`);
                        return;
                    }
                }
            } catch (error) {
                console.error('Error loading assessment detail:', error);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [user, firestore, id, isPendingMode]);

    // Timer countdown for quiz mode
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

    const handleStartAssessment = async () => {
        if (!firestore || !assessment || !admission || !user?.id) return;

        setStarting(true);
        try {
            const newAttemptId = await startAssessment(firestore, {
                assessmentId: assessment.id,
                assessmentTitle: assessment.title,
                userId: user.id,
                userName: user.name,
                userEmail: user.email,
                admissionId: admission.id,
                programId: assessment.programId || admission.interestedProgramId || '',
                programTitle: assessment.programTitle || admission.interestedProgramTitle || '',
            });
            setAttemptId(newAttemptId);
        } catch (error) {
            console.error('Error starting assessment:', error);
            alert('Failed to start assessment. Please try again.');
        } finally {
            setStarting(false);
        }
    };

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

    // ── Post-submit completion view ─────────────────────────────────────────────
    if (completed && score !== null) {
        const passingScore = assessment?.passingScore || 70;
        const passed = score >= passingScore;
        return (
            <div className="w-full min-h-screen bg-gray-50/50 p-2 md:p-4 font-body">
                <div className="w-full max-w-3xl mx-auto">
                    <div className="bg-white border border-primary/10 rounded-tl-3xl rounded-br-3xl shadow-2xl overflow-hidden">
                        {/* Hero band */}
                        <div className={cn('p-8 md:p-12 text-white relative overflow-hidden', passed ? 'bg-gradient-to-br from-green-500 to-emerald-600' : 'bg-gradient-to-br from-primary to-primary/80')}>
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
                                    {passed
                                        ? 'Congratulations — you have met the passing threshold for this assessment.'
                                        : 'You have completed the assessment. View your full report below for detailed feedback.'}
                                </p>
                                {/* Score + pass badge */}
                                <div className="inline-flex flex-col items-center bg-white/20 backdrop-blur-sm rounded-tl-2xl rounded-br-2xl px-10 py-5 gap-2">
                                    <p className="text-white/60 text-xs font-black uppercase tracking-widest mb-1">Your Score</p>
                                    <p className="text-6xl md:text-7xl font-black text-white leading-none">{score.toFixed(0)}%</p>
                                    <div className={cn('mt-1 px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest', passed ? 'bg-white text-green-600' : 'bg-white/30 text-white')}>
                                        {passed ? '✓ Passed' : `⚠ Below ${passingScore}% threshold`}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* CTA buttons */}
                        <div className="p-8 md:p-10 flex flex-col sm:flex-row gap-4">
                            <Link
                                href={`/dashboard/assessment/${assessment?.id}/report/${attemptId}`}
                                className="flex-1 inline-flex items-center justify-center gap-2 bg-accent hover:bg-accent/90 text-white rounded-tl-xl rounded-br-xl font-bold h-12 shadow-lg transition-all hover:shadow-xl hover:-translate-y-0.5"
                            >
                                <BarChart2 className="h-5 w-5" />
                                View Results Report
                            </Link>
                            <Button
                                onClick={() => router.push('/dashboard/admissions')}
                                variant="outline"
                                className="flex-1 rounded-tl-xl rounded-br-xl font-bold h-12"
                            >
                                View Admission Status
                            </Button>
                        </div>
                    </div>
                </div>
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
                                <div className={cn('flex items-center gap-3 px-6 py-3 rounded-tl-xl rounded-br-xl', timeRemaining < 300 ? 'bg-red-50 border-2 border-red-500' : 'bg-primary/5 border-2 border-primary/20')}>
                                    <Clock className={cn('h-6 w-6', timeRemaining < 300 ? 'text-red-600 animate-pulse' : 'text-primary')} />
                                    <div>
                                        <p className="text-xs font-bold text-primary/60 uppercase tracking-wider">Time Remaining</p>
                                        <p className={cn('text-2xl font-black', timeRemaining < 300 ? 'text-red-600' : 'text-primary')}>
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
                                    {currentQuestion.question}
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
                                                <div key={optionId} className={cn('flex items-center space-x-4 p-5 border-2 rounded-tl-xl rounded-br-xl transition-all cursor-pointer', isSelected ? 'border-accent bg-accent/5 shadow-md' : 'border-primary/10 hover:border-primary/30 hover:bg-primary/5')} onClick={() => handleAnswerChange(currentQuestion.id, optionId)}>
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
                                                <div key={option} className={cn('flex items-center space-x-4 p-5 border-2 rounded-tl-xl rounded-br-xl transition-all cursor-pointer', isSelected ? 'border-accent bg-accent/5 shadow-md' : 'border-primary/10 hover:border-primary/30 hover:bg-primary/5')} onClick={() => handleAnswerChange(currentQuestion.id, option)}>
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
                                        Next <ArrowLeft className="h-4 w-4 ml-2 rotate-180" />
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
                                        <button key={q.id} onClick={() => setCurrentQuestionIndex(index)} className={cn('h-10 w-full rounded-lg font-bold transition-all', isCurrent ? 'bg-accent text-white shadow-md scale-110' : isAnswered ? 'bg-green-500 text-white hover:bg-green-600' : 'bg-primary/10 text-primary hover:bg-primary/20')}>
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

    // ── Pending mode: show start screen ────────────────────────────────────────
    if (isPendingMode) {
        if (!admission || admission.status !== 'Pending Assessment') {
            return (
                <div className="w-full min-h-screen bg-gray-50/50 p-2 md:p-4 font-body">
                    <div className="w-full max-w-3xl mx-auto">
                        <Link href="/dashboard/assessment" className="inline-flex items-center text-primary hover:text-primary/80 font-medium mb-4">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Assessments
                        </Link>
                        <Card className="p-8 rounded-tl-2xl rounded-br-2xl rounded-tr-none rounded-bl-none text-center">
                            <AlertCircle className="h-12 w-12 text-primary/20 mx-auto mb-4" />
                            <p className="font-bold text-primary">No pending assessment found.</p>
                            <p className="text-primary/60 text-sm mt-2">Your admission may not require an assessment at this time.</p>
                        </Card>
                    </div>
                </div>
            );
        }

        if (!assessment) {
            return (
                <div className="w-full min-h-screen bg-gray-50/50 p-2 md:p-4 font-body">
                    <div className="w-full max-w-3xl mx-auto">
                        <Link href="/dashboard/assessment" className="inline-flex items-center text-primary hover:text-primary/80 font-medium mb-4">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Assessments
                        </Link>
                        <Card className="p-8 rounded-tl-2xl rounded-br-2xl rounded-tr-none rounded-bl-none text-center">
                            <AlertCircle className="h-12 w-12 text-primary/20 mx-auto mb-4" />
                            <p className="font-bold text-primary">Assessment not available yet.</p>
                            <p className="text-primary/60 text-sm mt-2">The assessment for your program hasn't been set up. Please check back later.</p>
                        </Card>
                    </div>
                </div>
            );
        }

        return (
            <div className="w-full min-h-screen bg-gray-50/50 p-2 md:p-4 font-body">
                <div className="w-full max-w-3xl mx-auto">
                    <Link href="/dashboard/assessment" className="inline-flex items-center text-primary hover:text-primary/80 font-medium mb-4">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Assessments
                    </Link>

                    <Card className="rounded-tl-2xl rounded-br-2xl rounded-tr-none rounded-bl-none bg-primary text-white overflow-hidden mb-6">
                        <CardContent className="p-8">
                            <div className="flex items-center gap-3 mb-3">
                                <FileText className="h-8 w-8 text-accent" />
                                <Badge className="bg-accent text-white border-none font-black text-[9px] uppercase tracking-widest">Action Required</Badge>
                            </div>
                            <h1 className="text-2xl md:text-3xl font-bold mb-2">{assessment.title}</h1>
                            <p className="text-white/80 mb-6">{assessment.description}</p>
                            <div className="flex flex-wrap gap-4 text-sm">
                                <div className="bg-white/10 px-4 py-2 rounded-tl-lg rounded-br-lg">
                                    <p className="text-[10px] uppercase font-black tracking-widest text-white/60">Questions</p>
                                    <p className="font-bold">{assessment.questions.length}</p>
                                </div>
                                <div className="bg-white/10 px-4 py-2 rounded-tl-lg rounded-br-lg">
                                    <p className="text-[10px] uppercase font-black tracking-widest text-white/60">Time Limit</p>
                                    <p className="font-bold">{assessment.timeLimit ? `${assessment.timeLimit} min` : 'No limit'}</p>
                                </div>
                                <div className="bg-white/10 px-4 py-2 rounded-tl-lg rounded-br-lg">
                                    <p className="text-[10px] uppercase font-black tracking-widest text-white/60">Pass Score</p>
                                    <p className="font-bold">{assessment.passingScore}%</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="p-8 rounded-tl-2xl rounded-br-2xl rounded-tr-none rounded-bl-none text-center">
                        <p className="text-primary/70 mb-6">When you're ready, click below to begin. The timer will start immediately.</p>
                        <Button
                            onClick={handleStartAssessment}
                            disabled={starting}
                            className="bg-accent hover:bg-accent/90 text-white rounded-tl-xl rounded-br-xl font-bold h-14 px-10 shadow-lg text-base"
                        >
                            {starting ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Starting...</> : <><FileText className="mr-2 h-5 w-5" /> Begin Assessment</>}
                        </Button>
                    </Card>
                </div>
            </div>
        );
    }

    // ── Review mode: show attempt results with answers ──────────────────────────
    if (!attempt || !assessment) {
        return (
            <div className="w-full min-h-screen bg-gray-50/50 p-2 md:p-4 font-body">
                <div className="w-full max-w-3xl mx-auto">
                    <Link href="/dashboard/assessment" className="inline-flex items-center text-primary hover:text-primary/80 font-medium mb-4">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Assessments
                    </Link>
                    <Card className="p-8 rounded-tl-2xl rounded-br-2xl rounded-tr-none rounded-bl-none text-center">
                        <AlertCircle className="h-12 w-12 text-primary/20 mx-auto mb-4" />
                        <p className="font-bold text-primary">Assessment not found.</p>
                    </Card>
                </div>
            </div>
        );
    }

    // Build a lookup of questionId → submitted answer
    const submittedAnswers: Record<string, string | number> = {};
    attempt.answers.forEach(a => {
        submittedAnswers[a.questionId] = a.answer;
    });

    return (
        <div className="w-full min-h-screen bg-gray-50/50 p-2 md:p-4 font-body">
            <div className="w-full max-w-3xl mx-auto">
                <Link href="/dashboard/assessment" className="inline-flex items-center text-primary hover:text-primary/80 font-medium mb-4">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Assessments
                </Link>

                {/* Hero card */}
                <Card className="rounded-tl-2xl rounded-br-2xl rounded-tr-none rounded-bl-none bg-primary text-white overflow-hidden mb-6">
                    <CardContent className="p-6 md:p-8">
                        <div className="flex items-start justify-between gap-4 mb-4">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                    {attempt.passed
                                        ? <Award className="h-6 w-6 text-yellow-400" />
                                        : <FileText className="h-6 w-6 text-white/60" />}
                                    <Badge className={cn('border-none font-black text-[9px] uppercase tracking-widest', attempt.passed ? 'bg-green-500 text-white' : 'bg-white/20 text-white')}>
                                        {attempt.passed ? 'Passed' : 'Below Pass'}
                                    </Badge>
                                </div>
                                <h1 className="text-2xl font-bold">{attempt.assessmentTitle}</h1>
                                <p className="text-white/70 text-sm mt-1">{attempt.programTitle}</p>
                            </div>
                            <div className="text-right shrink-0">
                                <p className="text-[10px] uppercase font-black tracking-widest text-white/50">Score</p>
                                <p className={cn('text-4xl font-black', attempt.passed ? 'text-green-400' : 'text-white')}>{attempt.score.toFixed(0)}%</p>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-3 text-sm">
                            <div className="flex items-center gap-2 text-white/70">
                                <TrendingUp className="h-4 w-4" />
                                <span>{attempt.earnedPoints}/{attempt.totalPoints} points</span>
                            </div>
                            {attempt.completedAt && (
                                <div className="flex items-center gap-2 text-white/70">
                                    <Calendar className="h-4 w-4" />
                                    <span>{format(attempt.completedAt.toDate(), 'MMM d, yyyy')}</span>
                                </div>
                            )}
                            <div className="flex items-center gap-2 text-white/70">
                                <FileText className="h-4 w-4" />
                                <span>{assessment.questions.length} questions</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Questions review */}
                <div className="space-y-4">
                    {assessment.questions.map((question, index) => {
                        const submitted = submittedAnswers[question.id];
                        const correct = question.correctAnswer ?? (question as any).correctOptionId;
                        const isCorrect = correct !== undefined && submitted === correct;
                        const isWrong = correct !== undefined && submitted !== undefined && submitted !== correct;

                        let submittedText = submitted !== undefined ? String(submitted) : 'No answer provided';
                        let correctText = correct !== undefined ? String(correct) : 'Not specified';

                        if (question.type === 'multiple-choice' && question.options) {
                            const correctOption = question.options.find((o: any) => typeof o === 'string' ? o === correct : o.id === correct);
                            if (correctOption) correctText = typeof correctOption === 'string' ? correctOption : (correctOption as any).text;

                            const submittedOption = question.options.find((o: any) => typeof o === 'string' ? o === submitted : o.id === submitted);
                            if (submittedOption) submittedText = typeof submittedOption === 'string' ? submittedOption : (submittedOption as any).text;
                        }

                        return (
                            <Card key={question.id} className={cn(
                                'p-6 md:p-8 rounded-tl-2xl rounded-br-2xl rounded-tr-none rounded-bl-none shadow-lg overflow-hidden relative border-none',
                                isCorrect ? 'bg-green-50/30' : isWrong ? 'bg-red-50/30' : 'bg-white'
                            )}>
                                {/* Status overlay edge */}
                                <div className={cn(
                                    "absolute top-0 left-0 bottom-0 w-2",
                                    isCorrect ? 'bg-green-500' : isWrong ? 'bg-red-500' : 'bg-primary/20'
                                )} />

                                <div className="absolute top-0 right-0 bg-primary/5 px-6 py-2 rounded-bl-2xl font-black text-primary/40 text-[10px] tracking-widest uppercase">
                                    {question.points} pt{question.points !== 1 ? 's' : ''}
                                </div>

                                <div className="flex flex-col gap-4 mb-8 pt-2 pl-4">
                                    <div className="flex gap-4">
                                        <div className="h-10 w-10 shrink-0 rounded-full bg-primary flex items-center justify-center font-black text-white text-sm shadow-md">
                                            {index + 1}
                                        </div>
                                        <Label className="text-lg md:text-xl font-bold text-primary leading-relaxed pt-1.5 cursor-default">
                                            {question.question}
                                        </Label>
                                    </div>

                                    <div className="pl-14 flex flex-wrap items-center gap-3 mt-2">
                                        {(isCorrect || isWrong) && (
                                            <div className="flex items-center gap-2">
                                                {isCorrect && <><CheckCircle className="h-5 w-5 text-green-600" /><span className="text-xs font-black text-green-600 tracking-widest uppercase bg-green-100 px-2 py-1 rounded">Correct</span></>}
                                                {isWrong && <><XCircle className="h-5 w-5 text-red-600" /><span className="text-xs font-black text-red-600 tracking-widest uppercase bg-red-100 px-2 py-1 rounded">Incorrect</span></>}
                                            </div>
                                        )}
                                        {question.competencyName && (
                                            <Badge variant="outline" className="text-[10px] font-black text-primary/60 border-primary/20 uppercase tracking-widest bg-white">
                                                {question.competencyName}
                                            </Badge>
                                        )}
                                    </div>
                                </div>

                                {/* Multiple choice options */}
                                {question.type === 'multiple-choice' && question.options && (
                                    <div className="space-y-4 pl-4 md:pl-14">
                                        {question.options.map((option: any) => {
                                            const optionId = typeof option === 'string' ? option : option.id;
                                            const optionText = typeof option === 'string' ? option : option.text;
                                            const isSelected = submitted === optionId;
                                            const isCorrectOption = correct === optionId;

                                            return (
                                                <div key={optionId} className={cn(
                                                    'flex items-center gap-4 p-5 rounded-tl-xl rounded-br-xl border-2 text-base font-medium transition-all',
                                                    isCorrectOption
                                                        ? 'border-green-400 bg-green-50 text-green-900 shadow-md'
                                                        : isSelected && !isCorrectOption
                                                            ? 'border-red-300 bg-red-50 text-red-900 shadow-md'
                                                            : 'border-primary/5 text-primary/70 bg-white hover:border-primary/20'
                                                )}>
                                                    {isCorrectOption ? <CheckCircle className="h-6 w-6 text-green-500 shrink-0" /> :
                                                        isSelected ? <XCircle className="h-6 w-6 text-red-400 shrink-0" /> :
                                                            <div className="h-6 w-6 rounded-full border-2 border-primary/20 shrink-0" />}
                                                    <span className="flex-1 text-[15px]">{optionText}</span>

                                                    <div className="flex flex-col gap-1 items-end shrink-0">
                                                        {isSelected && <Badge variant="outline" className={cn("text-[9px] font-black uppercase tracking-widest", isCorrectOption ? "border-green-300 bg-white text-green-700" : "border-red-300 bg-white text-red-700")}>Your Answer</Badge>}
                                                        {!isSelected && isCorrectOption && <Badge variant="outline" className="bg-green-100 text-green-800 border-none text-[9px] font-black uppercase tracking-widest">Correct Answer</Badge>}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                {/* True/False */}
                                {question.type === 'true-false' && (
                                    <div className="space-y-4 pl-4 md:pl-14">
                                        {['True', 'False'].map((option) => {
                                            const isSelected = submitted === option;
                                            const isCorrectOption = correct === option;
                                            return (
                                                <div key={option} className={cn(
                                                    'flex items-center gap-4 p-5 rounded-tl-xl rounded-br-xl border-2 text-base font-medium transition-all',
                                                    isCorrectOption
                                                        ? 'border-green-400 bg-green-50 text-green-900 shadow-md'
                                                        : isSelected && !isCorrectOption
                                                            ? 'border-red-300 bg-red-50 text-red-900 shadow-md'
                                                            : 'border-primary/5 text-primary/70 bg-white hover:border-primary/20'
                                                )}>
                                                    {isCorrectOption ? <CheckCircle className="h-6 w-6 text-green-500 shrink-0" /> :
                                                        isSelected ? <XCircle className="h-6 w-6 text-red-400 shrink-0" /> :
                                                            <div className="h-6 w-6 rounded-full border-2 border-primary/20 shrink-0" />}
                                                    <span className="flex-1 text-[15px]">{option}</span>

                                                    <div className="flex flex-col gap-1 items-end shrink-0">
                                                        {isSelected && <Badge variant="outline" className={cn("text-[9px] font-black uppercase tracking-widest", isCorrectOption ? "border-green-300 bg-white text-green-700" : "border-red-300 bg-white text-red-700")}>Your Answer</Badge>}
                                                        {!isSelected && isCorrectOption && <Badge variant="outline" className="bg-green-100 text-green-800 border-none text-[9px] font-black uppercase tracking-widest">Correct Answer</Badge>}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                {/* Explicit Answer Summary */}
                                <div className="mt-6 pt-6 border-t border-primary/5 pl-4 md:pl-14 flex flex-col sm:flex-row gap-4">
                                    <div className="flex-1 bg-primary/5 rounded-xl p-4 border border-primary/10">
                                        <p className="text-[10px] font-black text-primary/40 uppercase tracking-widest mb-1.5">Your Answer</p>
                                        <p className={cn("font-bold text-base", isCorrect ? "text-green-700" : isWrong ? "text-red-700" : "text-primary")}>
                                            {submittedText}
                                        </p>
                                    </div>
                                    <div className="flex-1 bg-green-50 rounded-xl p-4 border border-green-100">
                                        <p className="text-[10px] font-black text-green-600/60 uppercase tracking-widest mb-1.5">Correct Answer</p>
                                        <p className="font-bold text-base text-green-800">
                                            {correctText}
                                        </p>
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
