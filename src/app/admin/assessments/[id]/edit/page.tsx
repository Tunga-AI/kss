'use client';

import { use, useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useUsersFirestore, useDoc } from '@/firebase';
import { doc } from 'firebase/firestore';
import { updateAssessment } from '@/lib/assessments';
import { getCompetencyConfig, getDefaultCompetencies } from '@/lib/competencies';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, ArrowLeft, Save, Loader2, Layers, Tag } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import type { Assessment, AssessmentQuestion, CompetencyCategory } from '@/lib/assessment-types';

function generateId() {
    return Math.random().toString(36).substring(2, 9);
}

export default function EditAssessmentPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const firestore = useUsersFirestore(); // assessments in kenyasales DB
    const usersFirestore = useUsersFirestore(); // for competency config
    const { id } = use(params);

    const assessmentRef = useMemo(() => {
        if (!firestore) return null;
        return doc(firestore, 'assessments', id);
    }, [firestore, id]);
    const { data: assessment, loading } = useDoc<Assessment>(assessmentRef as any);

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [questions, setQuestions] = useState<AssessmentQuestion[]>([]);
    const [passingScore, setPassingScore] = useState(70);
    const [timeLimit, setTimeLimit] = useState<number | undefined>(30);
    const [saving, setSaving] = useState(false);
    const [competencyCategories, setCompetencyCategories] = useState<CompetencyCategory[]>([]);
    const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);

    // Load competencies from kenyasales DB
    useEffect(() => {
        if (!usersFirestore) return;
        (async () => {
            const config = await getCompetencyConfig(usersFirestore);
            setCompetencyCategories(config?.categories ?? getDefaultCompetencies());
        })();
    }, [usersFirestore]);

    const allCompetencies = useMemo(() =>
        competencyCategories.flatMap(cat => cat.competencies.map(c => ({ ...c, categoryName: cat.name }))),
        [competencyCategories]
    );

    const toggleCategory = (catId: string) => {
        setSelectedCategoryIds(prev =>
            prev.includes(catId) ? prev.filter(c => c !== catId) : [...prev, catId]
        );
    };

    // Load assessment data
    useEffect(() => {
        if (assessment) {
            setTitle(assessment.title);
            setDescription(assessment.description);
            setQuestions(assessment.questions || []);
            setPassingScore(assessment.passingScore);
            setTimeLimit(assessment.timeLimit);
            setSelectedCategoryIds(assessment.competencyIds || []);
        }
    }, [assessment]);

    const handleAddQuestion = () => {
        setQuestions([
            ...questions,
            {
                id: generateId(),
                question: '',
                type: 'multiple-choice',
                options: ['', ''],
                correctAnswer: 0,
                points: 10
            }
        ]);
    };

    const updateQuestion = (index: number, field: keyof AssessmentQuestion, value: any) => {
        const newQuestions = [...questions];
        (newQuestions[index] as any)[field] = value;
        setQuestions(newQuestions);
    };

    const addOption = (qIndex: number) => {
        const newQuestions = [...questions];
        if (newQuestions[qIndex].options) {
            newQuestions[qIndex].options!.push('');
            setQuestions(newQuestions);
        }
    };

    const updateOption = (qIndex: number, oIndex: number, value: string) => {
        const newQuestions = [...questions];
        if (newQuestions[qIndex].options) {
            newQuestions[qIndex].options![oIndex] = value;
            setQuestions(newQuestions);
        }
    };

    const removeOption = (qIndex: number, oIndex: number) => {
        const newQuestions = [...questions];
        if (newQuestions[qIndex].options && newQuestions[qIndex].options!.length > 2) {
            newQuestions[qIndex].options!.splice(oIndex, 1);
            setQuestions(newQuestions);
        }
    };

    const removeQuestion = (index: number) => {
        const newQuestions = [...questions];
        newQuestions.splice(index, 1);
        setQuestions(newQuestions);
    };

    const handleSave = async () => {
        if (!firestore || !title.trim()) {
            alert('Please provide a title');
            return;
        }

        // Validate questions
        for (const q of questions) {
            if (!q.question.trim()) {
                alert('All questions must have text');
                return;
            }
            if (q.type === 'multiple-choice' && (!q.options || q.options.length < 2)) {
                alert('Multiple choice questions must have at least 2 options');
                return;
            }
        }

        setSaving(true);

        try {
            await updateAssessment(firestore, id, {
                title,
                description,
                questions,
                passingScore,
                timeLimit,
                competencyIds: selectedCategoryIds,
            });

            alert('Assessment updated successfully!');
            router.push(`/a/assessments/${id}`);
        } catch (error) {
            console.error('Error updating assessment:', error);
            alert('Failed to update assessment');
        } finally {
            setSaving(false);
        }
    };

    if (!firestore || loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!assessment) {
        return <div>Assessment not found</div>;
    }

    return (
        <div className="w-full min-h-screen bg-gray-50/50 p-4 md:p-8 font-body">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => router.back()}
                        className="h-10 w-10"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-primary">Edit Assessment</h1>
                        <p className="text-sm text-primary/60">Update questions and settings</p>
                    </div>
                </div>
                <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-accent hover:bg-accent/90 text-white"
                >
                    {saving ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                        </>
                    ) : (
                        <>
                            <Save className="mr-2 h-4 w-4" />
                            Save Changes
                        </>
                    )}
                </Button>
            </div>

            {/* Basic Info */}
            <Card className="mb-8 border-primary/10 shadow-lg rounded-tl-2xl rounded-br-2xl">
                <CardHeader className="bg-primary/5 border-b border-primary/10">
                    <CardTitle className="text-lg font-bold text-primary">Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                    <div>
                        <Label className="text-sm font-bold text-primary/60 uppercase tracking-wider">Title</Label>
                        <Input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g., Sales Fundamentals Assessment"
                            className="mt-2"
                        />
                    </div>
                    <div>
                        <Label className="text-sm font-bold text-primary/60 uppercase tracking-wider">Description</Label>
                        <Textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Brief description of what this assessment covers..."
                            className="mt-2"
                            rows={3}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label className="text-sm font-bold text-primary/60 uppercase tracking-wider">Passing Score (%)</Label>
                            <Input
                                type="number"
                                min="0"
                                max="100"
                                value={passingScore}
                                onChange={(e) => setPassingScore(parseInt(e.target.value))}
                                className="mt-2"
                            />
                        </div>
                        <div>
                            <Label className="text-sm font-bold text-primary/60 uppercase tracking-wider">Time Limit (minutes)</Label>
                            <Input
                                type="number"
                                min="0"
                                value={timeLimit || ''}
                                onChange={(e) => setTimeLimit(e.target.value ? parseInt(e.target.value) : undefined)}
                                placeholder="No limit"
                                className="mt-2"
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Competency Categories */}
            {competencyCategories.length > 0 && (
                <Card className="mb-8 border-primary/10 shadow-lg rounded-tl-2xl rounded-br-2xl">
                    <CardHeader className="bg-primary/5 border-b border-primary/10">
                        <CardTitle className="text-lg font-bold text-primary flex items-center gap-2">
                            <Layers className="h-5 w-5 text-accent" />
                            Competency Categories
                        </CardTitle>
                        <p className="text-xs text-primary/50">Select the competency areas this assessment covers</p>
                    </CardHeader>
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
            <div className="space-y-6 mb-8">
                {questions.map((q, qIndex) => (
                    <Card key={q.id} className="border-primary/10 shadow-lg rounded-tl-2xl rounded-br-2xl">
                        <CardHeader className="bg-primary/5 border-b border-primary/10 flex flex-row items-center justify-between">
                            <CardTitle className="text-base font-bold text-primary">Question {qIndex + 1}</CardTitle>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeQuestion(qIndex)}
                                className="text-red-600 hover:bg-red-50"
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                            {/* Question Text */}
                            <div>
                                <Label className="text-sm font-bold text-primary/60 uppercase tracking-wider">Question Text</Label>
                                <Textarea
                                    value={q.question}
                                    onChange={(e) => updateQuestion(qIndex, 'question', e.target.value)}
                                    placeholder="Enter your question..."
                                    className="mt-2"
                                    rows={2}
                                />
                            </div>

                            {/* Type Selection */}
                            <div>
                                <Label className="text-sm font-bold text-primary/60 uppercase tracking-wider">Question Type</Label>
                                <RadioGroup
                                    value={q.type}
                                    onValueChange={(value) => {
                                        updateQuestion(qIndex, 'type', value);
                                        if (value === 'true-false') {
                                            updateQuestion(qIndex, 'options', ['True', 'False']);
                                            updateQuestion(qIndex, 'correctAnswer', 'True');
                                        }
                                    }}
                                    className="mt-2 flex gap-4"
                                >
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="multiple-choice" id={`type-mc-${q.id}`} />
                                        <Label htmlFor={`type-mc-${q.id}`}>Multiple Choice</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="true-false" id={`type-tf-${q.id}`} />
                                        <Label htmlFor={`type-tf-${q.id}`}>True/False</Label>
                                    </div>
                                </RadioGroup>
                            </div>

                            {/* Options (Multiple Choice) */}
                            {q.type === 'multiple-choice' && (
                                <div>
                                    <Label className="text-sm font-bold text-primary/60 uppercase tracking-wider">Options</Label>
                                    <div className="mt-2 space-y-2">
                                        {q.options?.map((option, oIndex) => (
                                            <div key={oIndex} className="flex items-center gap-2">
                                                <RadioGroupItem
                                                    value={oIndex.toString()}
                                                    checked={q.correctAnswer === oIndex}
                                                    onClick={() => updateQuestion(qIndex, 'correctAnswer', oIndex)}
                                                />
                                                <Input
                                                    value={option}
                                                    onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                                                    placeholder={`Option ${oIndex + 1}`}
                                                    className="flex-1"
                                                />
                                                {q.options && q.options.length > 2 && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => removeOption(qIndex, oIndex)}
                                                        className="text-red-600"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        ))}
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => addOption(qIndex)}
                                            className="mt-2"
                                        >
                                            <Plus className="h-4 w-4 mr-2" />
                                            Add Option
                                        </Button>
                                    </div>
                                    <p className="text-xs text-primary/60 mt-2">Click the radio button to select the correct answer</p>
                                </div>
                            )}

                            {/* True/False */}
                            {q.type === 'true-false' && (
                                <div>
                                    <Label className="text-sm font-bold text-primary/60 uppercase tracking-wider">Correct Answer</Label>
                                    <RadioGroup
                                        value={q.correctAnswer as string}
                                        onValueChange={(value) => updateQuestion(qIndex, 'correctAnswer', value)}
                                        className="mt-2 flex gap-4"
                                    >
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="True" id={`true-${q.id}`} />
                                            <Label htmlFor={`true-${q.id}`}>True</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="False" id={`false-${q.id}`} />
                                            <Label htmlFor={`false-${q.id}`}>False</Label>
                                        </div>
                                    </RadioGroup>
                                </div>
                            )}

                            {/* Points + Competency row */}
                            <div className="flex flex-wrap gap-4">
                                <div>
                                    <Label className="text-sm font-bold text-primary/60 uppercase tracking-wider">Points</Label>
                                    <Input
                                        type="number"
                                        min="1"
                                        value={q.points}
                                        onChange={(e) => updateQuestion(qIndex, 'points', parseInt(e.target.value) || 1)}
                                        className="mt-2 w-32"
                                    />
                                </div>
                                {competencyCategories.length > 0 && (
                                    <div className="flex-1 min-w-[200px]">
                                        <Label className="text-sm font-bold text-primary/60 uppercase tracking-wider flex items-center gap-1">
                                            <Tag className="h-3.5 w-3.5" /> Competency
                                        </Label>
                                        <select
                                            value={(q as any).competencyId || ''}
                                            onChange={(e) => {
                                                const comp = allCompetencies.find(c => c.id === e.target.value);
                                                updateQuestion(qIndex, 'competencyId' as any, e.target.value);
                                                updateQuestion(qIndex, 'competencyName' as any, comp?.name || '');
                                            }}
                                            className="mt-2 h-10 w-full rounded-md border border-input bg-gray-50 px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
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
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Add Question Button */}
            <Button
                onClick={handleAddQuestion}
                variant="outline"
                className="w-full h-16 border-2 border-dashed border-primary/20 hover:border-primary/40 hover:bg-primary/5"
            >
                <Plus className="h-5 w-5 mr-2" />
                Add Question
            </Button>
        </div>
    );
}
