'use client';

import { use, useMemo, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUsersFirestore, useCollection, useDoc } from '@/firebase';
import { doc, collection, query, where } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, BarChart3, Users, Clock, Loader2, Edit, Layers, Tag, Eye, BarChart2 } from 'lucide-react';
import type { Assessment, AssessmentAttempt, CompetencyCategory } from '@/lib/assessment-types';
import { getCompetencyConfig, getDefaultCompetencies } from '@/lib/competencies';
import { format } from 'date-fns';

export default function AssessmentDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const firestore = useUsersFirestore(); // assessments in kenyasales DB
    const { id } = use(params);

    const [competencyCategories, setCompetencyCategories] = useState<CompetencyCategory[]>([]);

    useEffect(() => {
        if (!firestore) return;
        (async () => {
            const config = await getCompetencyConfig(firestore);
            setCompetencyCategories(config?.categories ?? getDefaultCompetencies());
        })();
    }, [firestore]);

    // Fetch Assessment Data using useDoc
    const assessmentRef = useMemo(() => {
        if (!firestore) return null;
        return doc(firestore, 'assessments', id);
    }, [firestore, id]);

    const { data: assessment, loading: assessmentLoading } = useDoc<Assessment>(assessmentRef as any);

    // Fetch Assessment Attempts (not submissions - we're using assessment_attempts)
    const attemptsQuery = useMemo(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'assessment_attempts'), where('assessmentId', '==', id));
    }, [firestore, id]);

    const { data: attempts, loading: attemptsLoading } = useCollection<AssessmentAttempt>(attemptsQuery as any);

    if (!firestore || assessmentLoading || attemptsLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!assessment) {
        return <div>Assessment not found</div>;
    }

    const averageScore = attempts && attempts.length > 0
        ? (attempts.reduce((acc, curr) => acc + curr.score, 0) / attempts.length).toFixed(1)
        : 0;

    return (
        <div className="w-full min-h-screen bg-gray-50/50 p-4 md:p-8 font-body">

            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <Button variant="outline" size="icon" onClick={() => router.back()} className="h-10 w-10 border-primary/20 text-primary hover:bg-primary/5">
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold text-primary">{assessment.title}</h1>
                    <p className="text-sm text-primary/60">Assessment Analysis</p>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Card className="border-none shadow-lg bg-primary text-white">
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-white/10 flex items-center justify-center">
                            <Users className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <p className="text-white/60 text-sm font-bold uppercase tracking-widest">Total Attempts</p>
                            <p className="text-3xl font-bold">{attempts?.length || 0}</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-lg bg-white">
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center">
                            <BarChart3 className="h-6 w-6 text-accent" />
                        </div>
                        <div>
                            <p className="text-primary/40 text-sm font-bold uppercase tracking-widest">Average Score</p>
                            <p className="text-3xl font-bold text-primary">{averageScore}%</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-lg bg-white">
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-primary/5 flex items-center justify-center">
                            <Clock className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <p className="text-primary/40 text-sm font-bold uppercase tracking-widest">Questions</p>
                            <p className="text-3xl font-bold text-primary">{assessment.questions.length}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Assessment Details */}
            <Card className="border border-primary/10 shadow-xl rounded-tl-2xl rounded-br-2xl rounded-tr-none rounded-bl-none overflow-hidden mb-8">
                <CardHeader className="bg-primary/5 border-b border-primary/10 flex flex-row items-center justify-between">
                    <CardTitle className="text-lg font-bold text-primary">Assessment Details</CardTitle>
                    <Button
                        onClick={() => router.push(`/a/assessments/${id}/edit`)}
                        variant="outline"
                        size="sm"
                        className="gap-2"
                    >
                        <Edit className="h-4 w-4" />
                        Edit Questions
                    </Button>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="space-y-4">
                        <div>
                            <p className="text-sm font-bold text-primary/60 uppercase tracking-wider">Description</p>
                            <p className="text-primary mt-1">{assessment.description}</p>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <p className="text-sm font-bold text-primary/60 uppercase tracking-wider">Questions</p>
                                <p className="text-2xl font-bold text-primary">{assessment.questions.length}</p>
                            </div>
                            <div>
                                <p className="text-sm font-bold text-primary/60 uppercase tracking-wider">Passing Score</p>
                                <p className="text-2xl font-bold text-primary">{assessment.passingScore}%</p>
                            </div>
                            <div>
                                <p className="text-sm font-bold text-primary/60 uppercase tracking-wider">Time Limit</p>
                                <p className="text-2xl font-bold text-primary">{assessment.timeLimit || 'No'} min</p>
                            </div>
                        </div>

                        {/* Competency Categories */}
                        {assessment.competencyIds && assessment.competencyIds.length > 0 && (
                            <div>
                                <p className="text-sm font-bold text-primary/60 uppercase tracking-wider flex items-center gap-1 mb-2">
                                    <Layers className="h-4 w-4 text-accent" /> Competency Categories
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {assessment.competencyIds.map(catId => {
                                        const cat = competencyCategories.find(c => c.id === catId);
                                        return (
                                            <span key={catId} className="px-3 py-1 bg-accent/10 text-accent text-xs font-bold rounded-tl-md rounded-br-md">
                                                {cat?.name || catId}
                                            </span>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Questions & Competencies breakdown */}
            {assessment.questions && assessment.questions.length > 0 && (
                <Card className="border border-primary/10 shadow-xl rounded-tl-2xl rounded-br-2xl rounded-tr-none rounded-bl-none overflow-hidden mb-8">
                    <CardHeader className="bg-primary/5 border-b border-primary/10">
                        <CardTitle className="text-lg font-bold text-primary flex items-center gap-2">
                            <Tag className="h-5 w-5 text-accent" />
                            Questions &amp; Competencies
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent">
                                    <TableHead className="font-bold text-primary/40 uppercase tracking-widest text-xs pl-6 w-8">#</TableHead>
                                    <TableHead className="font-bold text-primary/40 uppercase tracking-widest text-xs">Question</TableHead>
                                    <TableHead className="font-bold text-primary/40 uppercase tracking-widest text-xs">Competency</TableHead>
                                    <TableHead className="font-bold text-primary/40 uppercase tracking-widest text-xs text-right pr-6">Points</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {assessment.questions.map((q, i) => (
                                    <TableRow key={q.id} className="hover:bg-primary/5 border-primary/5">
                                        <TableCell className="pl-6 text-primary/40 font-bold text-xs">{i + 1}</TableCell>
                                        <TableCell className="text-sm text-primary font-medium max-w-sm">
                                            {q.question}
                                        </TableCell>
                                        <TableCell>
                                            {q.competencyName ? (
                                                <span className="px-2 py-0.5 bg-primary/5 text-primary/70 text-[10px] font-bold rounded uppercase tracking-wider">
                                                    {q.competencyName}
                                                </span>
                                            ) : (
                                                <span className="text-primary/20 text-xs">—</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right pr-6 font-bold text-primary text-sm">{q.points}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}

            {/* Attempts Table */}
            <Card className="border border-primary/10 shadow-xl rounded-tl-2xl rounded-br-2xl rounded-tr-none rounded-bl-none overflow-hidden">
                <CardHeader className="bg-primary/5 border-b border-primary/10">
                    <CardTitle className="text-lg font-bold text-primary">Learner Attempts</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent">
                                <TableHead className="font-bold text-primary/40 uppercase tracking-widest text-xs pl-6">Learner</TableHead>
                                <TableHead className="font-bold text-primary/40 uppercase tracking-widest text-xs">Email</TableHead>
                                <TableHead className="font-bold text-primary/40 uppercase tracking-widest text-xs">Score</TableHead>
                                <TableHead className="font-bold text-primary/40 uppercase tracking-widest text-xs">Status</TableHead>
                                <TableHead className="font-bold text-primary/40 uppercase tracking-widest text-xs text-right pr-6">Date</TableHead>
                                <TableHead className="font-bold text-primary/40 uppercase tracking-widest text-xs text-right pr-6 w-16">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {attempts?.map((attempt) => (
                                <TableRow key={attempt.id} className="hover:bg-primary/5 transition-colors border-primary/5">
                                    <TableCell className="font-medium text-primary pl-6">{attempt.userName}</TableCell>
                                    <TableCell className="text-primary/60 text-sm">{attempt.userEmail}</TableCell>
                                    <TableCell>
                                        <Badge className={
                                            attempt.passed ? "bg-green-500 hover:bg-green-600" :
                                                attempt.score >= 50 ? "bg-yellow-500 hover:bg-yellow-600" :
                                                    "bg-red-500 hover:bg-red-600"
                                        }>
                                            {attempt.score.toFixed(0)}%
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={attempt.status === 'Completed' ? 'border-green-500 text-green-600' : 'border-yellow-500 text-yellow-600'}>
                                            {attempt.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-primary/60 text-sm text-right pr-6">
                                        {attempt.completedAt?.seconds ? format(new Date(attempt.completedAt.seconds * 1000), 'PPp') : 'In Progress'}
                                    </TableCell>
                                    <TableCell className="text-right pr-6">
                                        {attempt.status === 'Completed' && (
                                            <div className="flex items-center justify-end gap-1">
                                                <Button variant="ghost" size="sm" asChild className="h-8 shadow-none hover:bg-primary/5 rounded-tl-md rounded-br-md rounded-tr-none rounded-bl-none" title="Review answers">
                                                    <Link href={`/a/assessments/${id}/attempts/${attempt.id}`}>
                                                        <Eye className="h-4 w-4 text-primary" />
                                                    </Link>
                                                </Button>
                                                <Button variant="ghost" size="sm" asChild className="h-8 shadow-none hover:bg-accent/10 rounded-tl-md rounded-br-md rounded-tr-none rounded-bl-none" title="View report">
                                                    <Link href={`/a/assessments/${id}/attempts/${attempt.id}/report`}>
                                                        <BarChart2 className="h-4 w-4 text-accent" />
                                                    </Link>
                                                </Button>
                                            </div>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                            {(!attempts || attempts.length === 0) && (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-10 text-primary/40 font-bold uppercase tracking-widest text-xs">
                                        No attempts yet
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
