'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useFirestore, useUsersFirestore, useCollection } from '@/firebase';
// Note: assessments stored in kenyasales DB; programs fetched from default DB
import { addAssessment } from '@/lib/assessments';
import { getCompetencyConfig, getDefaultCompetencies } from '@/lib/competencies';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, ArrowLeft, Save, CheckCircle2, GripVertical, Layers, Tag } from 'lucide-react';
import { collection, query } from 'firebase/firestore';
import type { Program } from '@/lib/program-types';
import type { AssessmentRecommendationRule, CompetencyCategory } from '@/lib/assessment-types';

// Internal form question type (different from Firestore AssessmentQuestion)
interface FormOption { id: string; text: string; }
interface FormQuestion {
    id: string;
    text: string;
    type: string;
    options: FormOption[];
    correctOptionId: string;
    points: number;
    competencyId?: string;
    competencyName?: string;
}

function generateId() {
    return Math.random().toString(36).substring(2, 9);
}

export default function CreateAssessmentPage() {
    const router = useRouter();
    const assessmentsDb = useUsersFirestore(); // assessments live in kenyasales DB
    const programsDb = useFirestore();        // programs live in default DB
    const usersFirestore = useUsersFirestore(); // for competency config
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [questions, setQuestions] = useState<FormQuestion[]>([]);
    const [recommendationRules, setRecommendationRules] = useState<AssessmentRecommendationRule[]>([]);
    const [competencyCategories, setCompetencyCategories] = useState<CompetencyCategory[]>([]);
    const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
    const [saving, setSaving] = useState(false);

    // Load competencies from kenyasales DB
    useEffect(() => {
        if (!usersFirestore) return;
        (async () => {
            const config = await getCompetencyConfig(usersFirestore);
            setCompetencyCategories(config?.categories ?? getDefaultCompetencies());
        })();
    }, [usersFirestore]);

    // Flat list of all competencies for per-question picker
    const allCompetencies = useMemo(() =>
        competencyCategories.flatMap(cat => cat.competencies.map(c => ({ ...c, categoryName: cat.name }))),
        [competencyCategories]
    );

    const programsQuery = useMemo(() => {
        if (!programsDb) return null;
        return query(collection(programsDb, 'programs'));
    }, [programsDb]);

    const { data: programs } = useCollection<Program>(programsQuery as any);

    const handleAddQuestion = () => {
        setQuestions([
            ...questions,
            {
                id: generateId(),
                text: '',
                type: 'multiple_choice',
                options: [
                    { id: generateId(), text: '' },
                    { id: generateId(), text: '' }
                ],
                correctOptionId: '',
                points: 1
            }
        ]);
    };

    const updateQuestion = (index: number, field: keyof FormQuestion, value: any) => {
        const newQuestions = [...questions];
        newQuestions[index] = { ...newQuestions[index], [field]: value };
        setQuestions(newQuestions);
    };

    const addOption = (qIndex: number) => {
        const newQuestions = [...questions];
        newQuestions[qIndex].options.push({ id: generateId(), text: '' });
        setQuestions(newQuestions);
    };

    const updateOption = (qIndex: number, oIndex: number, text: string) => {
        const newQuestions = [...questions];
        newQuestions[qIndex].options[oIndex].text = text;
        setQuestions(newQuestions);
    };

    const removeOption = (qIndex: number, oIndex: number) => {
        const newQuestions = [...questions];
        newQuestions[qIndex].options.splice(oIndex, 1);
        setQuestions(newQuestions);
    };

    const removeQuestion = (index: number) => {
        const newQuestions = [...questions];
        newQuestions.splice(index, 1);
        setQuestions(newQuestions);
    };

    const toggleCategory = (id: string) => {
        setSelectedCategoryIds(prev =>
            prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
        );
    };

    const handleAddRule = () => {
        setRecommendationRules([
            ...recommendationRules,
            { minScore: 0, maxScore: 100, programId: '' }
        ]);
    };

    const updateRule = (index: number, field: keyof AssessmentRecommendationRule, value: any) => {
        const newRules = [...recommendationRules];
        (newRules[index] as any)[field] = value;
        setRecommendationRules(newRules);
    };

    const removeRule = (index: number) => {
        const newRules = [...recommendationRules];
        newRules.splice(index, 1);
        setRecommendationRules(newRules);
    };

    const handleSave = async () => {
        if (!title) return alert('Please enter a title');
        if (questions.length === 0) return alert('Please add at least one question');

        // Validate correct answers
        for (const q of questions) {
            if (!q.correctOptionId) return alert(`Please select a correct answer for question: "${q.text || 'Untitled'}"`);
        }

        setSaving(true);
        try {
            if (assessmentsDb) {
                // Convert internal FormQuestion to AssessmentQuestion
                const savedQuestions = questions.map(q => ({
                    id: q.id,
                    question: q.text,
                    type: 'multiple-choice' as const,
                    options: q.options.map(o => o.text),
                    correctAnswer: q.options.findIndex(o => o.id === q.correctOptionId),
                    points: q.points,
                    competencyId: q.competencyId,
                    competencyName: q.competencyName,
                }));
                await addAssessment(assessmentsDb, {
                    title,
                    description,
                    questions: savedQuestions,
                    recommendationRules,
                    competencyIds: selectedCategoryIds,
                    status: 'Active',
                    programId: '',
                    programTitle: '',
                    passingScore: 70,
                });
                router.push('/a/assessments');
            }
        } catch (e) {
            console.error(e);
            alert('Failed to save assessment');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="w-full min-h-screen bg-gray-50/50 font-body pb-20">
            {/* Header */}
            <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-primary/10 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()} className="text-primary/60 hover:text-primary">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-primary">Create Assessment</h1>
                        <p className="text-xs text-primary/40 uppercase tracking-widest font-bold">New Admission Test</p>
                    </div>
                </div>
                <Button onClick={handleSave} disabled={saving} className="bg-accent hover:bg-accent/90 text-white rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none font-bold px-6">
                    {saving ? 'Saving...' : (
                        <>
                            <Save className="h-4 w-4 mr-2" />
                            Save Assessment
                        </>
                    )}
                </Button>
            </div>

            <div className="max-w-4xl mx-auto p-6 space-y-8">

                {/* Basic Info */}
                <Card className="border-none shadow-lg rounded-tl-2xl rounded-br-2xl rounded-tr-none rounded-bl-none overflow-hidden">
                    <div className="bg-primary/5 p-4 border-b border-primary/10">
                        <h3 className="text-lg font-bold text-primary flex items-center gap-2">
                            <CheckCircle2 className="h-5 w-5 text-accent" />
                            Basic Information
                        </h3>
                    </div>
                    <CardContent className="p-6 space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="title" className="text-xs font-bold text-primary/40 uppercase tracking-widest">Title</Label>
                            <Input
                                id="title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="e.g. Software Engineering Admission Test"
                                className="h-12 bg-gray-50 border-primary/10 focus:border-primary rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description" className="text-xs font-bold text-primary/40 uppercase tracking-widest">Description</Label>
                            <Textarea
                                id="description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Instructions for the applicant..."
                                className="min-h-[100px] bg-gray-50 border-primary/10 focus:border-primary rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Competency Categories (assessment-level) */}
                {competencyCategories.length > 0 && (
                    <Card className="border-none shadow-lg rounded-tl-2xl rounded-br-2xl rounded-tr-none rounded-bl-none overflow-hidden">
                        <div className="bg-primary/5 p-4 border-b border-primary/10">
                            <h3 className="text-lg font-bold text-primary flex items-center gap-2">
                                <Layers className="h-5 w-5 text-accent" />
                                Competency Categories
                            </h3>
                            <p className="text-xs text-primary/50 mt-0.5">Select the competency areas this assessment covers</p>
                        </div>
                        <CardContent className="p-6">
                            <div className="flex flex-wrap gap-2">
                                {competencyCategories.map(cat => {
                                    const selected = selectedCategoryIds.includes(cat.id);
                                    return (
                                        <button
                                            key={cat.id}
                                            type="button"
                                            onClick={() => toggleCategory(cat.id)}
                                            className={`px-3 py-1.5 rounded-tl-lg rounded-br-lg rounded-tr-none rounded-bl-none text-xs font-bold border transition-all ${
                                                selected
                                                    ? 'bg-accent text-white border-accent shadow-md'
                                                    : 'bg-white text-primary/60 border-primary/20 hover:border-accent hover:text-accent'
                                            }`}
                                        >
                                            {selected && <span className="mr-1">✓</span>}
                                            {cat.name}
                                        </button>
                                    );
                                })}
                            </div>
                            {selectedCategoryIds.length > 0 && (
                                <p className="text-[10px] text-primary/40 mt-3 uppercase tracking-widest">
                                    {selectedCategoryIds.length} categor{selectedCategoryIds.length === 1 ? 'y' : 'ies'} selected
                                </p>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Questions */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-bold text-primary">Questions ({questions.length})</h3>
                        <Button variant="outline" onClick={handleAddQuestion} className="border-primary/20 text-primary hover:bg-primary/5">
                            <Plus className="h-4 w-4 mr-2" />
                            Add Question
                        </Button>
                    </div>

                    {questions.map((q, qIndex) => (
                        <Card key={q.id} className="border-primary/10 shadow-md group relative">
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-accent/20 group-hover:bg-accent transition-colors" />
                            <div className="p-6">
                                <div className="flex items-start gap-4">
                                    <div className="mt-3 text-primary/20">
                                        <GripVertical className="h-6 w-6" />
                                    </div>
                                    <div className="flex-1 space-y-4">
                                        <div className="flex gap-4">
                                            <div className="flex-1">
                                                <Input
                                                    value={q.text}
                                                    onChange={(e) => updateQuestion(qIndex, 'text', e.target.value)}
                                                    placeholder={`Question ${qIndex + 1}`}
                                                    className="font-bold text-lg border-none bg-transparent px-0 focus-visible:ring-0 placeholder:text-primary/20"
                                                />
                                            </div>
                                            <Button variant="ghost" size="icon" onClick={() => removeQuestion(qIndex)} className="text-red-400 hover:text-red-500 hover:bg-red-50">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                        <div className="flex flex-wrap gap-4 pl-4 border-l-2 border-primary/5">
                                            <div className="space-y-2">
                                                <Label className="text-xs text-primary/40 uppercase">Point Value</Label>
                                                <Input
                                                    type="number"
                                                    value={q.points}
                                                    onChange={(e) => updateQuestion(qIndex, 'points', parseInt(e.target.value) || 0)}
                                                    className="w-24 h-8 text-sm"
                                                />
                                            </div>
                                            {allCompetencies.length > 0 && (
                                                <div className="space-y-2 flex-1 min-w-[200px]">
                                                    <Label className="text-xs text-primary/40 uppercase flex items-center gap-1">
                                                        <Tag className="h-3 w-3" /> Competency
                                                    </Label>
                                                    <select
                                                        value={q.competencyId || ''}
                                                        onChange={(e) => {
                                                            const comp = allCompetencies.find(c => c.id === e.target.value);
                                                            updateQuestion(qIndex, 'competencyId', e.target.value);
                                                            updateQuestion(qIndex, 'competencyName', comp?.name || '');
                                                        }}
                                                        className="h-8 w-full rounded-tl-md rounded-br-md border border-input bg-gray-50 px-2 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
                                                    >
                                                        <option value="">— No competency —</option>
                                                        {competencyCategories.map(cat => (
                                                            <optgroup key={cat.id} label={cat.name}>
                                                                {cat.competencies.map(c => (
                                                                    <option key={c.id} value={c.id}>{c.name}</option>
                                                                ))}
                                                            </optgroup>
                                                        ))}
                                                    </select>
                                                </div>
                                            )}
                                        </div>

                                        <div className="space-y-3 pt-2">
                                            <Label className="text-xs font-bold text-primary/40 uppercase tracking-widest block mb-2">Answe Options</Label>
                                            {q.options.map((opt, oIndex) => (
                                                <div key={opt.id} className="flex items-center gap-3">
                                                    <input
                                                        type="radio"
                                                        name={`correct-${q.id}`}
                                                        checked={q.correctOptionId === opt.id}
                                                        onChange={() => updateQuestion(qIndex, 'correctOptionId', opt.id)}
                                                        className="w-4 h-4 text-accent focus:ring-accent border-gray-300"
                                                    />
                                                    <Input
                                                        value={opt.text}
                                                        onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                                                        placeholder={`Option ${oIndex + 1}`}
                                                        className={`h-10 ${q.correctOptionId === opt.id ? 'border-accent bg-accent/5 font-medium' : 'bg-gray-50'}`}
                                                    />
                                                    <Button variant="ghost" size="icon" onClick={() => removeOption(qIndex, oIndex)} className="text-primary/20 hover:text-red-500 h-8 w-8">
                                                        <Trash2 className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            ))}
                                            <Button variant="ghost" size="sm" onClick={() => addOption(qIndex)} className="ml-7 text-xs text-primary/60 hover:text-primary">
                                                <Plus className="h-3 w-3 mr-2" />
                                                Add Option
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>

                {/* Rules */}
                <div className="space-y-4 pt-8 border-t border-primary/10">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-xl font-bold text-primary">Recommendation Logic</h3>
                            <p className="text-sm text-primary/60">Automatically suggest programs based on score</p>
                        </div>
                        <Button variant="outline" onClick={handleAddRule} className="border-primary/20 text-primary hover:bg-primary/5">
                            <Plus className="h-4 w-4 mr-2" />
                            Add Rule
                        </Button>
                    </div>

                    <div className="grid gap-4">
                        {recommendationRules.map((rule, index) => (
                            <Card key={index} className="p-4 flex flex-col md:flex-row items-end gap-4 bg-gray-50/50">
                                <div className="flex-1 w-full space-y-2">
                                    <Label className="text-xs">Score Range (%)</Label>
                                    <div className="flex items-center gap-2">
                                        <Input
                                            type="number"
                                            value={rule.minScore}
                                            onChange={(e) => updateRule(index, 'minScore', parseInt(e.target.value))}
                                            placeholder="Min"
                                            className="bg-white"
                                        />
                                        <span className="text-primary/40">-</span>
                                        <Input
                                            type="number"
                                            value={rule.maxScore}
                                            onChange={(e) => updateRule(index, 'maxScore', parseInt(e.target.value))}
                                            placeholder="Max"
                                            className="bg-white"
                                        />
                                    </div>
                                </div>
                                <div className="flex-1 w-full space-y-2">
                                    <Label className="text-xs">Recommended Program</Label>
                                    <select
                                        value={rule.programId}
                                        onChange={(e) => updateRule(index, 'programId', e.target.value)}
                                        className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        <option value="">Select Program...</option>
                                        {programs?.map(p => (
                                            <option key={p.id} value={p.id}>{p.title}</option>
                                        ))}
                                    </select>
                                </div>
                                <Button variant="ghost" size="icon" onClick={() => removeRule(index)} className="mb-0.5 text-primary/20 hover:text-red-500">
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </Card>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
}
