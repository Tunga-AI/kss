'use client';

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, RefreshCw, CheckCircle, FileText, Clock, TrendingUp, AlertCircle, Loader2, BarChart2, Award, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useUser, useFirestore } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';
import type { Assessment, AssessmentAttempt } from '@/lib/assessment-types';
import { startAssessment, submitAssessment } from '@/lib/assessments';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export default function LearnerTakeAssessmentPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const { user, loading: userLoading } = useUser();
    const firestore = useFirestore();

    const [loading, setLoading] = useState(true);
    const [assessment, setAssessment] = useState<Assessment | null>(null);

    const [attemptId, setAttemptId] = useState<string | null>(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<string, string | number>>({});
    const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [completed, setCompleted] = useState(false);
    const [score, setScore] = useState<number | null>(null);
    const [starting, setStarting] = useState(false);

    useEffect(() => {
        const loadAssessment = async () => {
            if (!firestore || !id) return;
            try {
                const assessmentRef = doc(firestore, 'assessments', id);
                const assessmentSnap = await getDoc(assessmentRef);
                if (assessmentSnap.exists()) {
                    const data = { id: assessmentSnap.id, ...assessmentSnap.data() } as Assessment;
                    setAssessment(data);
                    if (data.timeLimit) {
                        setTimeRemaining(data.timeLimit * 60);
                    }
                }
            } catch (error) {
                console.error('Error loading assessment:', error);
            } finally {
                setLoading(false);
            }
        };
        loadAssessment();
    }, [firestore, id]);

    // Timer countdown for quiz mode
    useEffect(() => {
        if (timeRemaining === null || timeRemaining <= 0 || !attemptId || completed) return;

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
    }, [timeRemaining, attemptId, completed]);

    const handleStartAssessment = async () => {
        if (!firestore || !assessment || !user?.id) return;

        setStarting(true);
        try {
            const newAttemptId = await startAssessment(firestore, {
                assessmentId: assessment.id,
                assessmentTitle: assessment.title,
                userId: user.id,
                userName: user.name || 'Learner',
                userEmail: user.email || 'learner@example.com',
                admissionId: 'learner-test-' + Date.now(), // Fallback if no specific admission
                programId: assessment.programId || 'learner-test',
                programTitle: assessment.programTitle || 'Learner Self-Assessment',
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
        if (!firestore || !assessment || !attemptId) return;

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

    if (!assessment) {
        return (
            <div className="w-full min-h-screen bg-gray-50/50 p-2 md:p-4 font-body">
                <div className="w-full max-w-3xl mx-auto">
                    <Link href="/dashboard/assessment" className="inline-flex items-center text-primary hover:text-primary/80 font-medium mb-4">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Assessments
                    </Link>
                    <Card className="p-8 rounded-tl-2xl rounded-br-2xl text-center">
                        <AlertCircle className="h-12 w-12 text-primary/20 mx-auto mb-4" />
                        <p className="font-bold text-primary">Assessment not found.</p>
                    </Card>
                </div>
            </div>
        );
    }

    if (completed && score !== null) {
        const passingScore = assessment?.passingScore || 70;
        const passed = score >= passingScore;
        return (
            <div className="w-full min-h-screen bg-gray-50/50 p-2 md:p-4 font-body">
                <div className="w-full max-w-3xl mx-auto">
                    <div className="bg-white border border-primary/10 rounded-tl-3xl rounded-br-3xl shadow-2xl overflow-hidden">
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
                                        ? 'You have met the passing threshold for this assessment. Well done!'
                                        : 'Assessment complete. View your full competency report for personalised feedback.'}
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
                            <Link
                                href={`/dashboard/assessment/${id}/report/${attemptId}`}
                                className="flex-1 inline-flex items-center justify-center gap-2 bg-accent hover:bg-accent/90 text-white rounded-tl-xl rounded-br-xl font-bold h-12 shadow-lg transition-all hover:shadow-xl hover:-translate-y-0.5"
                            >
                                <BarChart2 className="h-5 w-5" />
                                View Results Report
                            </Link>
                            <button
                                onClick={() => router.push('/dashboard/assessment')}
                                className="flex-1 inline-flex items-center justify-center gap-2 border border-primary/20 text-primary hover:bg-primary/5 rounded-tl-xl rounded-br-xl font-bold h-12 transition-all"
                            >
                                Back to My Assessments
                            </button>
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
                                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">{assessment?.title}</h1>
                                <Badge className="bg-accent text-white border-none font-black text-[9px] uppercase tracking-widest ml-2 hidden sm:inline-flex">Available Assessment</Badge>
                            </div>
                            <p className="text-white/80 text-lg font-medium">{assessment?.description || "Take this assessment to proceed with your application"}</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <Button asChild variant="outline" className="border-white/30 text-white hover:bg-white hover:text-primary h-12 px-5 rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none font-bold transition-all">
                                <Link href="/dashboard/assessment">
                                    <ArrowLeft className="h-4 w-4 mr-2" />
                                    Back to Assessments
                                </Link>
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="w-full bg-white shadow-lg border border-primary/10 overflow-hidden rounded-tl-2xl rounded-br-2xl rounded-tr-none rounded-bl-none p-10 text-center flex flex-col items-center">
                    <div className="flex flex-wrap gap-4 text-sm mb-8 justify-center">
                        <div className="bg-primary/5 px-8 py-5 rounded-tl-lg rounded-br-lg border border-primary/10 shadow-sm">
                            <p className="text-[10px] uppercase font-black tracking-widest text-primary/60 mb-1">Questions</p>
                            <p className="font-bold text-3xl text-primary">{assessment?.questions?.length || 0}</p>
                        </div>
                        <div className="bg-primary/5 px-8 py-5 rounded-tl-lg rounded-br-lg border border-primary/10 shadow-sm">
                            <p className="text-[10px] uppercase font-black tracking-widest text-primary/60 mb-1">Time Limit</p>
                            <p className="font-bold text-3xl text-primary">{assessment?.timeLimit ? `${assessment.timeLimit} min` : 'No limit'}</p>
                        </div>
                        <div className="bg-primary/5 px-8 py-5 rounded-tl-lg rounded-br-lg border border-primary/10 shadow-sm">
                            <p className="text-[10px] uppercase font-black tracking-widest text-primary/60 mb-1">Pass Score</p>
                            <p className="font-bold text-3xl text-primary">{assessment?.passingScore}%</p>
                        </div>
                    </div>

                    <p className="text-primary/70 mb-6 max-w-xl mx-auto text-lg leading-relaxed">When you're ready, click below to try taking this assessment. The timer will start immediately.</p>
                    <Button
                        onClick={handleStartAssessment}
                        disabled={starting}
                        className="bg-accent hover:bg-accent/90 text-white rounded-tl-xl rounded-br-xl font-bold h-14 px-12 shadow-xl hover:shadow-2xl transition-all text-lg hover:-translate-y-1"
                    >
                        {starting ? <><Loader2 className="mr-2 h-6 w-6 animate-spin" /> Starting...</> : <><FileText className="mr-2 h-6 w-6" /> Start Assessment</>}
                    </Button>
                </div>
            </div>
        </div>
    );
}

