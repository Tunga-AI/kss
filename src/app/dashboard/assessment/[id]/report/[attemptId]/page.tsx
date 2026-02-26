'use client';

import { use, useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
    ArrowLeft, RefreshCw, FileText, Award, Calendar, AlertCircle,
    Sparkles, Printer, BarChart2, Target, Lightbulb, ChevronDown,
    ChevronUp, XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useFirestore, useUsersFirestore, useUser } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';
import type { Assessment, AssessmentAttempt, CompetencyCategory } from '@/lib/assessment-types';
import { getCompetencyConfig, getDefaultCompetencies } from '@/lib/competencies';
import { generateAssessmentReport, type AssessmentReportInput, type AssessmentReportOutput } from '@/ai/flows/assessment-report';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

// ─── Score helpers ──────────────────────────────────────────────────────────

function scoreToLabel(s10: number) {
    if (s10 < 1) return 'Very Low';
    if (s10 < 3) return 'Low';
    if (s10 < 4) return 'Below Average';
    if (s10 < 6) return 'Average';
    if (s10 < 7) return 'Above Average';
    if (s10 < 9) return 'High';
    return 'Very High';
}

function scoreColor(label: string) {
    const map: Record<string, string> = {
        'Very Low': 'text-red-600', 'Low': 'text-orange-600',
        'Below Average': 'text-yellow-600', 'Average': 'text-blue-600',
        'Above Average': 'text-teal-600', 'High': 'text-green-600', 'Very High': 'text-emerald-700',
    };
    return map[label] ?? 'text-primary';
}
function scoreBg(label: string) {
    const map: Record<string, string> = {
        'Very Low': 'bg-red-50 border-red-200', 'Low': 'bg-orange-50 border-orange-200',
        'Below Average': 'bg-yellow-50 border-yellow-200', 'Average': 'bg-blue-50 border-blue-200',
        'Above Average': 'bg-teal-50 border-teal-200', 'High': 'bg-green-50 border-green-200',
        'Very High': 'bg-emerald-50 border-emerald-200',
    };
    return map[label] ?? 'bg-primary/5 border-primary/10';
}

const SCORE_LABELS = ['Very Low', 'Low', 'Below Average', 'Average', 'Above Average', 'High', 'Very High'];

function ScoreBar({ score10, label }: { score10: number; label: string }) {
    const colorMap: Record<string, string> = {
        'Very Low': 'bg-red-500', 'Low': 'bg-orange-500', 'Below Average': 'bg-yellow-500',
        'Average': 'bg-blue-500', 'Above Average': 'bg-teal-500', 'High': 'bg-green-500', 'Very High': 'bg-emerald-600',
    };
    return (
        <div className="w-full">
            <div className="flex justify-between text-[10px] font-black text-primary/40 uppercase tracking-widest mb-2">
                <span>0</span>{[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => <span key={n}>{n}</span>)}
            </div>
            <div className="relative h-4 bg-primary/5 rounded-full overflow-hidden border border-primary/10">
                <div className={cn('h-full rounded-full transition-all duration-700', colorMap[label] ?? 'bg-primary')} style={{ width: `${(score10 / 10) * 100}%` }} />
            </div>
            <div className="flex justify-between mt-2">
                {SCORE_LABELS.map((l, i) => (
                    <span key={i} className={cn('text-[9px] font-black uppercase tracking-widest px-1', l === label ? scoreColor(label) : 'text-primary/20')}>{l}</span>
                ))}
            </div>
        </div>
    );
}

function CompetencyRadar({ results }: { results: { name: string; score10: number }[] }) {
    if (results.length === 0) return null;
    const cx = 150, cy = 150, r = 100, n = results.length;
    const pts = results.map((res, i) => {
        const a = (2 * Math.PI * i) / n - Math.PI / 2;
        const rr = (res.score10 / 10) * r;
        return { dx: cx + rr * Math.cos(a), dy: cy + rr * Math.sin(a), fx: cx + r * Math.cos(a), fy: cy + r * Math.sin(a), lx: cx + (r + 22) * Math.cos(a), ly: cy + (r + 22) * Math.sin(a), label: res.name };
    });
    return (
        <svg viewBox="0 0 300 300" className="w-full max-w-xs mx-auto">
            {[2, 4, 6, 8, 10].map(v => {
                const rr = (v / 10) * r;
                return <polygon key={v} points={results.map((_, i) => { const a = (2 * Math.PI * i) / n - Math.PI / 2; return `${cx + rr * Math.cos(a)},${cy + rr * Math.sin(a)}`; }).join(' ')} fill="none" stroke="#e5e7eb" strokeWidth="1" />;
            })}
            {pts.map((p, i) => <line key={i} x1={cx} y1={cy} x2={p.fx} y2={p.fy} stroke="#e5e7eb" strokeWidth="1" />)}
            <polygon points={pts.map(p => `${p.dx},${p.dy}`).join(' ')} fill="rgba(59,130,246,0.15)" stroke="#3b82f6" strokeWidth="2" />
            {pts.map((p, i) => <circle key={i} cx={p.dx} cy={p.dy} r="4" fill="#3b82f6" stroke="white" strokeWidth="2" />)}
            {pts.map((p, i) => <text key={i} x={p.lx} y={p.ly} textAnchor="middle" dominantBaseline="middle" fontSize="7.5" fill="#374151" fontWeight="600">{p.label.length > 13 ? p.label.slice(0, 12) + '…' : p.label}</text>)}
        </svg>
    );
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function LearnerReportPage({ params }: { params: Promise<{ id: string; attemptId: string }> }) {
    const { id, attemptId } = use(params);
    const { user } = useUser();
    const firestore = useFirestore();
    const usersFirestore = useUsersFirestore();

    const [loading, setLoading] = useState(true);
    const [attempt, setAttempt] = useState<AssessmentAttempt | null>(null);
    const [assessment, setAssessment] = useState<Assessment | null>(null);
    const [competencyCategories, setCompetencyCategories] = useState<CompetencyCategory[]>([]);
    const [generating, setGenerating] = useState(false);
    const [report, setReport] = useState<AssessmentReportOutput | null>(null);
    const [reportError, setReportError] = useState<string | null>(null);
    const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

    useEffect(() => {
        const load = async () => {
            if (!firestore || !usersFirestore || !attemptId) return;
            try {
                const atSnap = await getDoc(doc(firestore, 'assessment_attempts', attemptId));
                if (atSnap.exists()) {
                    const atData = { id: atSnap.id, ...atSnap.data() } as AssessmentAttempt;
                    setAttempt(atData);
                    // Try usersFirestore first (admin DB), fall back to firestore
                    let asSnap = await getDoc(doc(usersFirestore, 'assessments', id));
                    if (!asSnap.exists()) asSnap = await getDoc(doc(firestore, 'assessments', id));
                    if (asSnap.exists()) setAssessment({ id: asSnap.id, ...asSnap.data() } as Assessment);
                }
                const cfg = await getCompetencyConfig(usersFirestore);
                setCompetencyCategories(cfg?.categories ?? getDefaultCompetencies());
            } catch (e) { console.error(e); }
            finally { setLoading(false); }
        };
        load();
    }, [firestore, usersFirestore, id, attemptId]);

    const competencyResults = useMemo(() => {
        if (!attempt || !assessment) return [];
        const submitted: Record<string, string | number> = {};
        attempt.answers.forEach(a => { submitted[a.questionId] = a.answer; });
        const map: Record<string, { competencyId: string; competencyName: string; categoryName: string; categoryDescription: string; questionsAttempted: number; questionsCorrect: number; earnedPoints: number; totalPoints: number }> = {};
        assessment.questions.forEach(q => {
            if (!q.competencyId || !q.competencyName) return;
            const cat = competencyCategories.find(c => c.competencies.some(comp => comp.id === q.competencyId));
            if (!map[q.competencyId]) map[q.competencyId] = {
                competencyId: q.competencyId, competencyName: q.competencyName,
                categoryName: cat?.name ?? 'General', categoryDescription: cat?.description ?? '',
                questionsAttempted: 0, questionsCorrect: 0, earnedPoints: 0, totalPoints: 0,
            };
            const correct = q.correctAnswer ?? (q as any).correctOptionId;
            map[q.competencyId].questionsAttempted++;
            map[q.competencyId].totalPoints += q.points;
            if (correct !== undefined && submitted[q.id] === correct) {
                map[q.competencyId].questionsCorrect++;
                map[q.competencyId].earnedPoints += q.points;
            }
        });
        return Object.values(map).map(r => ({
            ...r,
            scorePercent: r.totalPoints > 0 ? (r.earnedPoints / r.totalPoints) * 100 : 0,
            scoreOutOf10: r.totalPoints > 0 ? (r.earnedPoints / r.totalPoints) * 10 : 0,
        }));
    }, [attempt, assessment, competencyCategories]);

    const handleGenerateReport = async () => {
        if (!attempt || !assessment) return;
        setGenerating(true); setReportError(null);
        try {
            const input: AssessmentReportInput = {
                learnerName: attempt.userName,
                assessmentTitle: assessment.title,
                assessmentDescription: assessment.description,
                overallScore: attempt.score,
                passed: attempt.passed,
                passingScore: assessment.passingScore,
                completedAt: attempt.completedAt ? format(new Date(attempt.completedAt.seconds * 1000), 'PPP') : 'Unknown',
                competencyResults: competencyResults.map(r => ({
                    competencyId: r.competencyId, competencyName: r.competencyName,
                    categoryName: r.categoryName, categoryDescription: r.categoryDescription,
                    questionsAttempted: r.questionsAttempted, questionsCorrect: r.questionsCorrect,
                    earnedPoints: r.earnedPoints, totalPoints: r.totalPoints,
                    scorePercent: Math.round(r.scorePercent), scoreOutOf10: Math.round(r.scoreOutOf10 * 10) / 10,
                })),
            };
            const result = await generateAssessmentReport(input);
            setReport(result);
            setExpandedSections(new Set(result.competencyNarratives.map(n => n.competencyName)));
        } catch (err: any) {
            setReportError(err?.message ?? 'Failed to generate report. Please try again.');
        } finally { setGenerating(false); }
    };

    if (loading) return (
        <div className="p-8 flex items-center justify-center min-h-screen">
            <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        </div>
    );

    if (!attempt || !assessment) return (
        <div className="w-full min-h-screen bg-gray-50/50 p-4 font-body flex items-center justify-center">
            <Card className="p-12 rounded-tl-2xl rounded-br-2xl text-center max-w-sm">
                <AlertCircle className="h-12 w-12 text-primary/20 mx-auto mb-4" />
                <p className="font-bold text-primary">Report not found.</p>
                <Link href="/dashboard/assessment" className="mt-4 inline-flex text-sm text-primary/60 hover:text-primary underline">← Back to Assessments</Link>
            </Card>
        </div>
    );

    const completedAtDate = attempt.completedAt ? format(new Date(attempt.completedAt.seconds * 1000), 'PPP') : 'Unknown';
    const overallScore10 = Math.round((attempt.score / 100) * 10 * 10) / 10;
    const overallLabel = report?.overallScoreLabel ?? scoreToLabel(overallScore10);

    return (
        <div className="w-full min-h-screen bg-gray-50/50 p-4 md:p-8 font-body print:bg-white">
            <div className="w-full max-w-4xl mx-auto">

                {/* ── Top bar ── */}
                <div className="flex items-center justify-between gap-4 mb-8 flex-wrap print:hidden">
                    <Link
                        href="/dashboard/assessment"
                        className="inline-flex items-center gap-2 text-primary font-medium bg-white px-4 py-2 rounded-tl-lg rounded-br-lg shadow-sm border border-primary/10 transition-all hover:bg-primary hover:text-white group"
                    >
                        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                        Back to My Assessments
                    </Link>
                    <div className="flex items-center gap-3">
                        <Button
                            onClick={handleGenerateReport}
                            disabled={generating}
                            className="bg-accent hover:bg-accent/90 text-white rounded-tl-xl rounded-br-xl font-bold h-10 px-5 shadow-lg"
                        >
                            {generating
                                ? <><RefreshCw className="h-4 w-4 mr-2 animate-spin" />Generating…</>
                                : <><Sparkles className="h-4 w-4 mr-2" />{report ? 'Regenerate AI Insights' : 'Generate AI Insights'}</>
                            }
                        </Button>
                        <Button variant="outline" onClick={() => window.print()} className="h-10 px-4 rounded-tl-xl rounded-br-xl font-bold border-primary/20">
                            <Printer className="h-4 w-4 mr-2" />Print
                        </Button>
                    </div>
                </div>

                {/* ── Hero card ── */}
                <Card className="rounded-tl-3xl rounded-br-3xl rounded-tr-none rounded-bl-none bg-primary text-white overflow-hidden mb-8 shadow-2xl relative border-none">
                    <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-accent/20 rounded-full blur-3xl opacity-20 pointer-events-none" />
                    <CardContent className="p-8 md:p-10 relative z-10">
                        <div className="flex flex-col md:flex-row items-start justify-between gap-6">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-3">
                                    <BarChart2 className="h-5 w-5 text-accent" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Your Competency Report</span>
                                </div>
                                <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-1">{attempt.userName}</h1>
                                <p className="text-xl font-bold text-white/90 mt-3">{assessment.title}</p>
                                <div className="mt-4 flex flex-wrap gap-4">
                                    <div className="flex items-center gap-2 text-white/70 text-sm">
                                        <Calendar className="h-4 w-4 text-accent" />
                                        <span>Completed {completedAtDate}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-white/70 text-sm">
                                        <FileText className="h-4 w-4 text-accent" />
                                        <span>{assessment.questions.length} questions</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-white/70 text-sm">
                                        <Target className="h-4 w-4 text-accent" />
                                        <span>Pass threshold: {assessment.passingScore}%</span>
                                    </div>
                                </div>
                            </div>
                            <div className="shrink-0 flex flex-col items-center justify-center bg-white/10 rounded-tl-2xl rounded-br-2xl px-10 py-8 border border-white/10">
                                <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Your Score</p>
                                <p className={cn('text-6xl font-black tracking-tighter', attempt.passed ? 'text-green-400' : 'text-yellow-400')}>
                                    {attempt.score.toFixed(0)}%
                                </p>
                                <p className="text-white/50 text-sm mt-1 font-bold">{overallLabel}</p>
                                <div className={cn('mt-3 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest', attempt.passed ? 'bg-green-500 text-white' : 'bg-yellow-500 text-white')}>
                                    {attempt.passed ? '✓ Passed' : '⚠ Below Pass'}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="space-y-8">

                    {/* ── 1. About This Assessment ── */}
                    <section>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="h-8 w-8 rounded-tl-lg rounded-br-lg bg-accent/10 flex items-center justify-center text-accent font-black text-sm">1</div>
                            <h2 className="text-xl font-black text-primary uppercase tracking-wide">About This Assessment</h2>
                        </div>
                        <Card className="p-6 md:p-8 rounded-tl-2xl rounded-br-2xl rounded-tr-none rounded-bl-none border border-primary/10 shadow-md">
                            {report?.assessmentDescription ? (
                                <div className="space-y-3">{report.assessmentDescription.split('\n').filter(Boolean).map((p, i) => <p key={i} className="text-sm text-primary/80 leading-relaxed">{p}</p>)}</div>
                            ) : (
                                <>
                                    <p className="text-primary/80 leading-relaxed text-sm mb-4">{assessment.description}</p>
                                    {competencyResults.length > 0 && (
                                        <div className="mt-4 p-4 bg-primary/5 rounded-xl">
                                            <p className="text-[10px] font-black text-primary/40 uppercase tracking-widest mb-3">Areas Measured</p>
                                            <div className="flex flex-wrap gap-2">
                                                {[...new Set(competencyResults.map(r => r.categoryName))].map(cat => (
                                                    <span key={cat} className="px-3 py-1.5 bg-white border border-primary/10 rounded-tl-md rounded-br-md text-xs font-bold text-primary shadow-sm">{cat}</span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {!report && (
                                        <div className="mt-6 p-4 bg-accent/5 border border-accent/20 rounded-xl flex items-start gap-3">
                                            <Sparkles className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                                            <p className="text-sm text-primary/70">Click <strong>"Generate AI Insights"</strong> above to get personalised coaching narratives and development tips for each competency.</p>
                                        </div>
                                    )}
                                </>
                            )}
                        </Card>
                    </section>

                    {/* ── 2. Overall Score ── */}
                    <section>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="h-8 w-8 rounded-tl-lg rounded-br-lg bg-accent/10 flex items-center justify-center text-accent font-black text-sm">2</div>
                            <h2 className="text-xl font-black text-primary uppercase tracking-wide">Your Overall Score</h2>
                        </div>
                        <Card className="p-6 md:p-8 rounded-tl-2xl rounded-br-2xl rounded-tr-none rounded-bl-none border border-primary/10 shadow-md">
                            <div className="flex flex-col md:flex-row gap-8 items-start">
                                <div className={cn('shrink-0 rounded-2xl border-2 p-6 text-center min-w-[160px]', scoreBg(overallLabel))}>
                                    <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">Score</p>
                                    <p className={cn('text-5xl font-black tracking-tighter', scoreColor(overallLabel))}>{overallScore10.toFixed(1)}</p>
                                    <p className="text-xs font-bold text-primary/40 mt-1">out of 10</p>
                                    <div className={cn('mt-2 text-xs font-black uppercase tracking-widest', scoreColor(overallLabel))}>{overallLabel}</div>
                                </div>
                                <div className="flex-1 w-full">
                                    <ScoreBar score10={overallScore10} label={overallLabel} />
                                    <div className="mt-6 flex flex-wrap gap-3">
                                        {[
                                            { label: 'Raw Score', value: `${attempt.earnedPoints}/${attempt.totalPoints} pts` },
                                            { label: 'Percentage', value: `${attempt.score.toFixed(1)}%` },
                                            { label: 'Questions', value: `${attempt.answers.length} answered` },
                                        ].map(item => (
                                            <div key={item.label} className="bg-primary/5 rounded-xl px-4 py-3">
                                                <p className="text-[10px] font-black text-primary/40 uppercase tracking-widest">{item.label}</p>
                                                <p className="font-black text-primary">{item.value}</p>
                                            </div>
                                        ))}
                                    </div>
                                    {report?.overallNarrative && (
                                        <div className="mt-6 space-y-3">
                                            {report.overallNarrative.split('\n').filter(Boolean).map((p, i) => <p key={i} className="text-sm text-primary/80 leading-relaxed">{p}</p>)}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Card>
                    </section>

                    {/* ── 3. Competency Graph ── */}
                    {competencyResults.length > 0 && (
                        <section>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="h-8 w-8 rounded-tl-lg rounded-br-lg bg-accent/10 flex items-center justify-center text-accent font-black text-sm">3</div>
                                <h2 className="text-xl font-black text-primary uppercase tracking-wide">Competency Breakdown</h2>
                            </div>
                            <Card className="p-6 md:p-8 rounded-tl-2xl rounded-br-2xl rounded-tr-none rounded-bl-none border border-primary/10 shadow-md">
                                <div className="flex flex-col lg:flex-row gap-8 items-center">
                                    <div className="w-full lg:w-72 shrink-0">
                                        <CompetencyRadar results={competencyResults.map(r => ({ name: r.competencyName, score10: r.scoreOutOf10 }))} />
                                    </div>
                                    <div className="flex-1 w-full space-y-4">
                                        {competencyResults.map(r => {
                                            const lbl = scoreToLabel(r.scoreOutOf10);
                                            const barColor: Record<string, string> = {
                                                'Very Low': 'bg-red-400', 'Low': 'bg-orange-400', 'Below Average': 'bg-yellow-400',
                                                'Average': 'bg-blue-400', 'Above Average': 'bg-teal-400', 'High': 'bg-green-400', 'Very High': 'bg-emerald-500',
                                            };
                                            return (
                                                <div key={r.competencyId}>
                                                    <div className="flex justify-between items-center mb-1.5">
                                                        <span className="text-sm font-bold text-primary">{r.competencyName}</span>
                                                        <span className={cn('text-xs font-black', scoreColor(lbl))}>{r.scoreOutOf10.toFixed(1)}/10 · {lbl}</span>
                                                    </div>
                                                    <div className="h-3 bg-primary/5 rounded-full overflow-hidden border border-primary/10">
                                                        <div className={cn('h-full rounded-full', barColor[lbl] ?? 'bg-primary')} style={{ width: `${(r.scoreOutOf10 / 10) * 100}%` }} />
                                                    </div>
                                                    <p className="text-[10px] text-primary/40 mt-1">{r.questionsCorrect}/{r.questionsAttempted} correct · {r.categoryName}</p>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </Card>
                        </section>
                    )}

                    {/* ── 4. Detailed Results ── */}
                    <section>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="h-8 w-8 rounded-tl-lg rounded-br-lg bg-accent/10 flex items-center justify-center text-accent font-black text-sm">4</div>
                            <h2 className="text-xl font-black text-primary uppercase tracking-wide">Detailed Results</h2>
                        </div>

                        {reportError && (
                            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-start gap-2">
                                <XCircle className="h-5 w-5 shrink-0 mt-0.5" />{reportError}
                            </div>
                        )}
                        {generating && (
                            <Card className="p-12 rounded-tl-2xl rounded-br-2xl border border-accent/20 shadow-md flex flex-col items-center gap-4 text-center mb-6">
                                <div className="relative"><RefreshCw className="h-10 w-10 animate-spin text-accent" /><Sparkles className="h-4 w-4 text-accent absolute -top-1 -right-1 animate-pulse" /></div>
                                <p className="font-black text-primary">AI is analysing your results…</p>
                                <p className="text-sm text-primary/50">Generating personalised insights and development tips</p>
                            </Card>
                        )}
                        {competencyResults.length === 0 && !generating && (
                            <Card className="p-8 rounded-tl-2xl rounded-br-2xl border border-yellow-200 bg-yellow-50 text-center mb-6">
                                <AlertCircle className="h-10 w-10 text-yellow-500 mx-auto mb-3" />
                                <p className="font-bold text-yellow-800 mb-1">Competency breakdown unavailable</p>
                                <p className="text-sm text-yellow-700">The questions in this assessment haven't been tagged with competencies yet. Your score is still recorded above.</p>
                            </Card>
                        )}

                        <div className="space-y-6">
                            {competencyResults.map((r, idx) => {
                                const narrative = report?.competencyNarratives?.find(n => n.competencyName === r.competencyName);
                                const lbl = narrative?.scoreLabel ?? scoreToLabel(r.scoreOutOf10);
                                const isExpanded = expandedSections.has(r.competencyName);
                                const badgeMap: Record<string, string> = {
                                    'Very Low': 'bg-red-100 text-red-700', 'Low': 'bg-orange-100 text-orange-700',
                                    'Below Average': 'bg-yellow-100 text-yellow-700', 'Average': 'bg-blue-100 text-blue-700',
                                    'Above Average': 'bg-teal-100 text-teal-700', 'High': 'bg-green-100 text-green-700', 'Very High': 'bg-emerald-100 text-emerald-700',
                                };
                                return (
                                    <Card key={r.competencyId} className={cn('rounded-tl-2xl rounded-br-2xl rounded-tr-none rounded-bl-none border shadow-md overflow-hidden', scoreBg(lbl))}>
                                        <button
                                            onClick={() => setExpandedSections(prev => { const s = new Set(prev); s.has(r.competencyName) ? s.delete(r.competencyName) : s.add(r.competencyName); return s; })}
                                            className="w-full p-6 flex items-center gap-4 text-left hover:bg-black/5 transition-colors"
                                        >
                                            <div className="h-10 w-10 rounded-full bg-white border-2 border-primary/20 flex items-center justify-center font-black text-primary shrink-0 shadow-sm">{idx + 1}</div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-black text-primary text-lg">{r.competencyName}</p>
                                                <p className="text-[10px] font-black text-primary/40 uppercase tracking-widest">{r.categoryName}</p>
                                            </div>
                                            <div className="flex items-center gap-3 shrink-0">
                                                <div className="text-center">
                                                    <p className={cn('text-3xl font-black tracking-tight', scoreColor(lbl))}>{r.scoreOutOf10.toFixed(1)}</p>
                                                    <p className="text-[10px] text-primary/40 font-bold">/ 10</p>
                                                </div>
                                                <Badge className={cn('text-[9px] font-black uppercase tracking-widest border-none', badgeMap[lbl] ?? 'bg-primary/10 text-primary')}>{lbl}</Badge>
                                                {isExpanded ? <ChevronUp className="h-4 w-4 text-primary/40" /> : <ChevronDown className="h-4 w-4 text-primary/40" />}
                                            </div>
                                        </button>
                                        <div className={cn('border-t border-primary/10 bg-white', isExpanded ? 'block' : 'hidden')}>
                                            <div className="p-6 md:p-8 space-y-6">
                                                <ScoreBar score10={r.scoreOutOf10} label={lbl} />
                                                <div className="flex flex-wrap gap-3">
                                                    {[
                                                        { label: 'Correct', value: `${r.questionsCorrect}/${r.questionsAttempted}`, sub: 'questions' },
                                                        { label: 'Points', value: `${r.earnedPoints}/${r.totalPoints}`, sub: 'earned' },
                                                        { label: 'Accuracy', value: `${r.scorePercent.toFixed(0)}%`, sub: 'on this area' },
                                                    ].map(item => (
                                                        <div key={item.label} className="bg-primary/5 rounded-xl px-4 py-3 flex-1 min-w-[90px]">
                                                            <p className="text-[10px] font-black text-primary/40 uppercase tracking-widest mb-0.5">{item.label}</p>
                                                            <p className="font-black text-primary text-lg">{item.value}</p>
                                                            <p className="text-[10px] text-primary/40">{item.sub}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                                {narrative ? (
                                                    <>
                                                        <p className="text-sm text-primary/80 leading-relaxed">{narrative.personalizedComment}</p>
                                                        <div className="flex items-start gap-3 p-4 bg-accent/5 border border-accent/20 rounded-xl">
                                                            <Lightbulb className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                                                            <div>
                                                                <p className="text-[10px] font-black text-accent uppercase tracking-widest mb-1">Development Tip</p>
                                                                <p className="text-sm text-primary/80 leading-relaxed">{narrative.developmentTip}</p>
                                                            </div>
                                                        </div>
                                                        <div className="border-t border-primary/5 pt-4">
                                                            <p className="text-[10px] font-black text-primary/40 uppercase tracking-widest mb-2 flex items-center gap-1"><FileText className="h-3 w-3" />Definition</p>
                                                            <p className="text-sm text-primary/60 leading-relaxed italic">{narrative.definition}</p>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <div className="flex items-start gap-3 p-4 bg-accent/5 border border-accent/20 rounded-xl">
                                                        <Sparkles className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                                                        <p className="text-sm text-primary/60">Click <strong>"Generate AI Insights"</strong> above to get personalised coaching tips for this competency.</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </Card>
                                );
                            })}
                        </div>

                        {report?.overallRecommendation && (
                            <Card className="mt-8 p-6 md:p-8 rounded-tl-2xl rounded-br-2xl rounded-tr-none rounded-bl-none border border-accent/20 bg-accent/5 shadow-md">
                                <div className="flex items-start gap-4">
                                    <div className="h-10 w-10 rounded-tl-xl rounded-br-xl bg-accent flex items-center justify-center shrink-0">
                                        <Award className="h-5 w-5 text-white" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-accent uppercase tracking-widest mb-2">Your Coaching Recommendation</p>
                                        <p className="text-sm text-primary/80 leading-relaxed">{report.overallRecommendation}</p>
                                    </div>
                                </div>
                            </Card>
                        )}
                    </section>

                    <div className="text-center text-[10px] text-primary/30 font-bold uppercase tracking-widest pt-6 border-t border-primary/5">
                        KSS Academy · Report generated {format(new Date(), 'PPP')} · Confidential
                    </div>
                </div>
            </div>
        </div>
    );
}
