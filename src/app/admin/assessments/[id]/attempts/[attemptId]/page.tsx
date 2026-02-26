'use client';

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, RefreshCw, CheckCircle, XCircle, FileText, Award, Calendar, TrendingUp, AlertCircle, BarChart2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { useFirestore } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';
import type { Assessment, AssessmentAttempt } from '@/lib/assessment-types';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export default function AdminAttemptReviewPage({ params }: { params: Promise<{ id: string, attemptId: string }> }) {
    const { id, attemptId } = use(params);
    const router = useRouter();
    const firestore = useFirestore();

    const [loading, setLoading] = useState(true);
    const [attempt, setAttempt] = useState<AssessmentAttempt | null>(null);
    const [assessment, setAssessment] = useState<Assessment | null>(null);

    useEffect(() => {
        const loadData = async () => {
            if (!firestore || !attemptId) return;

            try {
                // Load attempt by ID for review
                const attemptRef = doc(firestore, 'assessment_attempts', attemptId);
                const attemptSnap = await getDoc(attemptRef);

                if (attemptSnap.exists()) {
                    const attemptData = { id: attemptSnap.id, ...attemptSnap.data() } as AssessmentAttempt;
                    setAttempt(attemptData);

                    // Load the assessment questions
                    const assessmentRef = doc(firestore, 'assessments', id);
                    const assessmentSnap = await getDoc(assessmentRef);
                    if (assessmentSnap.exists()) {
                        setAssessment({ id: assessmentSnap.id, ...assessmentSnap.data() } as Assessment);
                    }
                }
            } catch (error) {
                console.error('Error loading attempt detail:', error);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [firestore, id, attemptId]);

    if (loading) {
        return (
            <div className="p-8 flex items-center justify-center min-h-[calc(100vh-6rem)]">
                <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!attempt || !assessment) {
        return (
            <div className="w-full min-h-[calc(100vh-6rem)] bg-gray-50/50 p-4 md:p-8 font-body">
                <div className="w-full">
                    <Link href={`/a/assessments/${id}`} className="inline-flex items-center text-primary hover:text-primary/80 font-medium mb-4">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Assessment
                    </Link>
                    <Card className="p-8 rounded-tl-2xl rounded-br-2xl rounded-tr-none rounded-bl-none text-center">
                        <AlertCircle className="h-12 w-12 text-primary/20 mx-auto mb-4" />
                        <p className="font-bold text-primary">Attempt details not found.</p>
                    </Card>
                </div>
            </div>
        );
    }

    const submittedAnswers: Record<string, string | number> = {};
    if (attempt.answers) {
        attempt.answers.forEach(a => {
            submittedAnswers[a.questionId] = a.answer;
        });
    }

    return (
        <div className="w-full min-h-[calc(100vh-6rem)] bg-gray-50/50 p-4 md:p-8 font-body">
            <div className="w-full">
                <div className="flex items-center justify-between gap-4 mb-8 flex-wrap">
                    <Link href={`/a/assessments/${id}`} className="inline-flex items-center text-primary hover:text-primary/80 font-medium bg-white px-4 py-2 rounded-tl-lg rounded-br-lg shadow-sm border border-primary/10 transition-all hover:bg-primary hover:text-white group">
                        <ArrowLeft className="h-4 w-4 mr-2 transition-transform group-hover:-translate-x-1" />
                        Back to Assessment Overview
                    </Link>
                    <Link href={`/a/assessments/${id}/attempts/${attemptId}/report`} className="inline-flex items-center gap-2 bg-accent text-white font-bold px-5 py-2 rounded-tl-lg rounded-br-lg shadow-md hover:bg-accent/90 transition-all text-sm">
                        <BarChart2 className="h-4 w-4" />
                        View Full Report
                    </Link>
                </div>

                {/* Hero card */}
                <Card className="rounded-tl-3xl rounded-br-3xl rounded-tr-none rounded-bl-none bg-primary text-white overflow-hidden mb-8 shadow-2xl relative border-none">
                    <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-accent/20 rounded-full blur-3xl opacity-20 pointer-events-none" />
                    <CardContent className="p-8 md:p-10 relative z-10">
                        <div className="flex flex-col md:flex-row items-start justify-between gap-6 mb-6">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-4">
                                    {attempt.passed
                                        ? <div className="bg-yellow-400/20 p-2 rounded-lg text-yellow-400"><Award className="h-6 w-6" /></div>
                                        : <div className="bg-red-400/20 p-2 rounded-lg text-red-400"><XCircle className="h-6 w-6" /></div>}
                                    <Badge className={cn('border-none font-black text-[10px] uppercase tracking-widest px-3 py-1', attempt.passed ? 'bg-green-500 text-white shadow-lg' : 'bg-red-500 text-white shadow-lg')}>
                                        {attempt.passed ? 'Passed' : 'Failed'}
                                    </Badge>
                                </div>
                                <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-2">{assessment?.title}</h1>
                                <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-2 text-white/90 bg-white/10 p-4 rounded-tl-xl rounded-br-xl backdrop-blur-sm">
                                    <span className="font-bold text-lg">{attempt.userName}</span>
                                    <span className="hidden sm:inline text-white/40">•</span>
                                    <span className="text-white/70">{attempt.userEmail}</span>
                                </div>
                            </div>
                            <div className="bg-white/10 px-8 py-6 rounded-tl-2xl rounded-br-2xl text-center shrink-0 border border-white/10 backdrop-blur-md shadow-xl">
                                <p className="text-[10px] uppercase font-black tracking-widest text-white/50 mb-2">Final Score</p>
                                <p className={cn('text-5xl md:text-6xl font-black tracking-tighter', attempt.passed ? 'text-green-400' : 'text-red-400')}>{attempt.score.toFixed(0)}%</p>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-4 text-sm mt-8 pt-6 border-t border-white/10">
                            <div className="flex items-center gap-2 text-white/80 font-medium bg-black/20 px-4 py-2 rounded-tl-lg rounded-br-lg shadow-inner">
                                <TrendingUp className="h-4 w-4 text-accent" />
                                <span>{attempt.earnedPoints} / {attempt.totalPoints} Points</span>
                            </div>
                            {attempt.completedAt && (
                                <div className="flex items-center gap-2 text-white/80 font-medium bg-black/20 px-4 py-2 rounded-tl-lg rounded-br-lg shadow-inner">
                                    <Calendar className="h-4 w-4 text-accent" />
                                    <span>{format(new Date(attempt.completedAt.seconds ? attempt.completedAt.seconds * 1000 : (attempt.completedAt as any)), 'PPp')}</span>
                                </div>
                            )}
                            <div className="flex items-center gap-2 text-white/80 font-medium bg-black/20 px-4 py-2 rounded-tl-lg rounded-br-lg shadow-inner">
                                <FileText className="h-4 w-4 text-accent" />
                                <span>{assessment.questions.length} Questions</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <h2 className="text-xl font-black tracking-tight text-primary flex items-center gap-3 mb-6 px-2">
                    <div className="p-2 bg-accent/20 rounded-lg text-accent">
                        <FileText className="h-5 w-5" />
                    </div>
                    Review Responses
                </h2>

                {/* Questions review */}
                <div className="space-y-6">
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
                                                        {isSelected && <Badge variant="outline" className={cn("text-[9px] font-black uppercase tracking-widest", isCorrectOption ? "border-green-300 bg-white text-green-700" : "border-red-300 bg-white text-red-700")}>Learner's answer</Badge>}
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
                                                        {isSelected && <Badge variant="outline" className={cn("text-[9px] font-black uppercase tracking-widest", isCorrectOption ? "border-green-300 bg-white text-green-700" : "border-red-300 bg-white text-red-700")}>Learner's answer</Badge>}
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
                                        <p className="text-[10px] font-black text-primary/40 uppercase tracking-widest mb-1.5">Learner's Answer</p>
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
