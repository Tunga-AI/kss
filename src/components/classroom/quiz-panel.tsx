'use client';

import { useState, useMemo } from 'react';
import { useFirestore, useCollection, useUser } from '@/firebase';
import { collection, query, where, orderBy, addDoc, serverTimestamp, updateDoc, doc } from 'firebase/firestore';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BarChart3, Plus, X, Check, Hand } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import type { Quiz, QuizResponse } from '@/lib/classroom-types';

interface QuizPanelProps {
    sessionId: string;
    isInstructor: boolean;
    room?: any;
}

export function QuizPanel({ sessionId, isInstructor, room }: QuizPanelProps) {
    const firestore = useFirestore();
    const { user } = useUser();
    const [showCreateForm, setShowCreateForm] = useState(false);

    const quizzesQuery = useMemo(() => {
        if (!firestore) return null;
        return query(
            collection(firestore, 'quizzes'),
            where('sessionId', '==', sessionId),
            orderBy('createdAt', 'desc')
        );
    }, [firestore, sessionId]);

    const { data: quizzes } = useCollection<Quiz>(quizzesQuery as any);
    const activeQuiz = quizzes?.find(q => q.isActive);

    const handleCreateQuickPoll = async (name: string, templateOptions: string[]) => {
        if (!firestore || !user || !room) return;

        try {
            const quizData = {
                sessionId,
                question: `Quick Poll: ${name}`,
                options: templateOptions,
                type: 'poll' as const,
                createdBy: user.uid,
                createdAt: serverTimestamp(),
                isActive: true,
            };

            const docRef = await addDoc(collection(firestore, 'quizzes'), quizData);

            // Notify via LiveKit
            const payload = new TextEncoder().encode(JSON.stringify({
                type: 'quiz_started',
                quizId: docRef.id,
                question: quizData.question,
            }));
            await room.localParticipant.publishData(payload, { reliable: true });

            toast({ title: 'Quick Poll started!' });
            setShowCreateForm(false);
        } catch (error) {
            console.error('Error creating quick poll:', error);
        }
    };

    return (
        <div className="flex flex-col h-full">
            {isInstructor && (
                <div className="p-4 border-b border-primary/10">
                    <Button
                        onClick={() => setShowCreateForm(!showCreateForm)}
                        className="w-full bg-primary hover:bg-accent"
                    >
                        {showCreateForm ? (
                            <>
                                <X className="h-4 w-4 mr-2" />
                                Cancel
                            </>
                        ) : (
                            <>
                                <Plus className="h-4 w-4 mr-2" />
                                Create Poll/Quiz
                            </>
                        )}
                    </Button>
                </div>
            )}

            <ScrollArea className="flex-1 p-4">
                {showCreateForm && isInstructor ? (
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <p className="text-[10px] font-bold uppercase text-primary/40 tracking-wider">Quick Templates</p>
                            <div className="grid grid-cols-2 gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-xs h-8 bg-primary/5 hover:bg-primary/10 border-primary/10"
                                    onClick={() => handleCreateQuickPoll('Yes/No', ['Yes', 'No'])}
                                >
                                    Yes / No
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-xs h-8 bg-primary/5 hover:bg-primary/10 border-primary/10"
                                    onClick={() => handleCreateQuickPoll('A/B/C', ['Option A', 'Option B', 'Option C'])}
                                >
                                    A / B / C
                                </Button>
                            </div>
                        </div>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-primary/5" />
                            </div>
                            <div className="relative flex justify-center text-[10px] uppercase">
                                <span className="bg-white px-2 text-primary/30">Or Custom</span>
                            </div>
                        </div>

                        <CreateQuizForm
                            sessionId={sessionId}
                            onCreated={() => setShowCreateForm(false)}
                            room={room}
                        />
                    </div>
                ) : (
                    <div className="space-y-4">
                        {activeQuiz && (
                            <QuizItem
                                quiz={activeQuiz}
                                isInstructor={isInstructor}
                                isActive={true}
                            />
                        )}

                        {quizzes && quizzes.filter(q => !q.isActive).length > 0 && (
                            <div>
                                <p className="text-xs font-bold uppercase text-primary/40 mb-3">Previous</p>
                                {quizzes
                                    .filter(q => !q.isActive)
                                    .map(quiz => (
                                        <QuizItem
                                            key={quiz.id}
                                            quiz={quiz}
                                            isInstructor={isInstructor}
                                            isActive={false}
                                        />
                                    ))}
                            </div>
                        )}

                        {(!quizzes || quizzes.length === 0) && (
                            <div className="text-center py-8">
                                <BarChart3 className="h-12 w-12 mx-auto text-primary/20 mb-2" />
                                <p className="text-sm text-primary/40">No polls or quizzes yet</p>
                                {isInstructor && (
                                    <p className="text-xs text-primary/30 mt-1">Create one to engage your students</p>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </ScrollArea>
        </div>
    );
}

function CreateQuizForm({ sessionId, onCreated, room }: { sessionId: string; onCreated: () => void; room?: any }) {
    const firestore = useFirestore();
    const { user } = useUser();
    const [question, setQuestion] = useState('');
    const [options, setOptions] = useState(['', '']);
    const [type, setType] = useState<'poll' | 'quiz'>('poll');
    const [correctAnswer, setCorrectAnswer] = useState<number>();
    const [creating, setCreating] = useState(false);

    const handleAddOption = () => {
        if (options.length < 6) {
            setOptions([...options, '']);
        }
    };

    const handleRemoveOption = (index: number) => {
        if (options.length > 2) {
            setOptions(options.filter((_, i) => i !== index));
            if (correctAnswer === index) setCorrectAnswer(undefined);
        }
    };

    const handleOptionChange = (index: number, value: string) => {
        const newOptions = [...options];
        newOptions[index] = value;
        setOptions(newOptions);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!firestore || !user || creating) return;

        const validOptions = options.filter(o => o.trim());
        if (!question.trim() || validOptions.length < 2) {
            toast({
                title: 'Invalid input',
                description: 'Please provide a question and at least 2 options',
                variant: 'destructive',
            });
            return;
        }

        if (type === 'quiz' && correctAnswer === undefined) {
            toast({
                title: 'Missing correct answer',
                description: 'Please select the correct answer for the quiz',
                variant: 'destructive',
            });
            return;
        }

        setCreating(true);
        try {
            const docRef = await addDoc(collection(firestore, 'quizzes'), {
                sessionId,
                question: question.trim(),
                options: validOptions,
                correctAnswer: type === 'quiz' ? correctAnswer : undefined,
                type,
                createdBy: user.uid,
                createdAt: serverTimestamp(),
                isActive: true,
            });

            // Notify via LiveKit
            if (room?.localParticipant) {
                const payload = new TextEncoder().encode(JSON.stringify({
                    type: 'quiz_started',
                    quizId: docRef.id,
                    question: question.trim(),
                }));
                await room.localParticipant.publishData(payload, { reliable: true });
            }

            toast({
                title: `${type === 'poll' ? 'Poll' : 'Quiz'} created`,
                description: 'Students can now respond',
            });

            onCreated();
        } catch (error) {
            console.error('Error creating quiz:', error);
            toast({
                title: 'Failed to create',
                description: 'Please try again',
                variant: 'destructive',
            });
        } finally {
            setCreating(false);
        }
    };

    return (
        <Card className="p-4">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <Label className="text-xs font-bold uppercase text-primary/60 mb-2">Type</Label>
                    <RadioGroup value={type} onValueChange={(v) => setType(v as 'poll' | 'quiz')}>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="poll" id="poll" />
                            <Label htmlFor="poll" className="font-normal cursor-pointer">Poll (Opinion)</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="quiz" id="quiz" />
                            <Label htmlFor="quiz" className="font-normal cursor-pointer">Quiz (Has correct answer)</Label>
                        </div>
                    </RadioGroup>
                </div>

                <div>
                    <Label>Question</Label>
                    <Input
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        placeholder="Enter your question..."
                        className="mt-1"
                    />
                </div>

                <div className="space-y-2">
                    <Label>Options</Label>
                    {options.map((option, index) => (
                        <div key={index} className="flex gap-2">
                            {type === 'quiz' && (
                                <RadioGroup value={correctAnswer?.toString()} onValueChange={(v) => setCorrectAnswer(Number(v))}>
                                    <RadioGroupItem value={index.toString()} />
                                </RadioGroup>
                            )}
                            <Input
                                value={option}
                                onChange={(e) => handleOptionChange(index, e.target.value)}
                                placeholder={`Option ${index + 1}`}
                                className="flex-1"
                            />
                            {options.length > 2 && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    onClick={() => handleRemoveOption(index)}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    ))}
                    {options.length < 6 && (
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleAddOption}
                            className="w-full"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Option
                        </Button>
                    )}
                </div>

                <Button type="submit" disabled={creating} className="w-full">
                    {creating ? 'Creating...' : `Create ${type === 'poll' ? 'Poll' : 'Quiz'}`}
                </Button>
            </form>
        </Card>
    );
}

function QuizItem({ quiz, isInstructor, isActive }: { quiz: Quiz; isInstructor: boolean; isActive: boolean }) {
    const firestore = useFirestore();
    const { user } = useUser();

    const responsesQuery = useMemo(() => {
        if (!firestore) return null;
        return query(
            collection(firestore, 'quizResponses'),
            where('quizId', '==', quiz.id)
        );
    }, [firestore, quiz.id]);

    const { data: responses } = useCollection<QuizResponse>(responsesQuery as any);
    const userResponse = responses?.find(r => r.userId === user?.uid);

    const handleSubmitResponse = async (optionIndex: number) => {
        if (!firestore || !user || userResponse) return;

        try {
            await addDoc(collection(firestore, 'quizResponses'), {
                quizId: quiz.id,
                sessionId: quiz.sessionId,
                userId: user.uid,
                userName: user.displayName || user.email || 'Anonymous',
                selectedOption: optionIndex,
                submittedAt: serverTimestamp(),
                isCorrect: quiz.correctAnswer !== undefined ? quiz.correctAnswer === optionIndex : undefined,
            });

            toast({
                title: 'Response submitted',
                description: 'Thank you for your response',
            });
        } catch (error) {
            console.error('Error submitting response:', error);
            toast({
                title: 'Failed to submit',
                description: 'Please try again',
                variant: 'destructive',
            });
        }
    };

    const handleEndQuiz = async () => {
        if (!firestore) return;
        try {
            await updateDoc(doc(firestore, 'quizzes', quiz.id), {
                isActive: false,
            });
            toast({
                title: `${quiz.type === 'poll' ? 'Poll' : 'Quiz'} ended`,
            });
        } catch (error) {
            console.error('Error ending quiz:', error);
        }
    };

    const optionCounts = quiz.options.map((_, index) =>
        responses?.filter(r => r.selectedOption === index).length || 0
    );
    const totalResponses = responses?.length || 0;

    return (
        <Card className={cn('p-4 mb-4', isActive && 'border-accent border-2')}>
            <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                    <Badge className={cn('mb-2', isActive ? 'bg-accent' : 'bg-primary/20')}>
                        {quiz.type === 'poll' ? 'Poll' : 'Quiz'}
                        {isActive && ' • Live'}
                    </Badge>
                    <p className="font-semibold text-primary">{quiz.question}</p>
                </div>
                {isInstructor && isActive && (
                    <Button size="sm" variant="outline" onClick={handleEndQuiz}>
                        End
                    </Button>
                )}
            </div>

            <div className="space-y-2">
                {quiz.options.map((option, index) => {
                    const count = optionCounts[index];
                    const percentage = totalResponses > 0 ? (count / totalResponses) * 100 : 0;
                    const isSelected = userResponse?.selectedOption === index;
                    const isCorrect = quiz.correctAnswer === index;

                    return (
                        <div key={index} className="space-y-1">
                            <button
                                onClick={() => !userResponse && isActive && handleSubmitResponse(index)}
                                disabled={!!userResponse || !isActive || isInstructor}
                                className={cn(
                                    'w-full text-left p-3 rounded-lg border transition-colors',
                                    isSelected && 'border-accent bg-accent/10',
                                    !userResponse && isActive && !isInstructor && 'hover:bg-primary/5 cursor-pointer',
                                    (userResponse || !isActive || isInstructor) && 'cursor-default'
                                )}
                            >
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-primary">{option}</span>
                                    {(isInstructor || userResponse || !isActive) && (
                                        <div className="flex items-center gap-2">
                                            {isCorrect && quiz.type === 'quiz' && (
                                                <Check className="h-4 w-4 text-green-500" />
                                            )}
                                            <span className="text-sm text-primary/60">
                                                {count} ({percentage.toFixed(0)}%)
                                            </span>
                                        </div>
                                    )}
                                </div>
                                {(isInstructor || userResponse || !isActive) && (
                                    <Progress value={percentage} className="h-2 mt-2" />
                                )}
                            </button>
                        </div>
                    );
                })}
            </div>

            <div className="mt-3 pt-3 border-t border-primary/10">
                <p className="text-xs text-primary/60">
                    {totalResponses} {totalResponses === 1 ? 'response' : 'responses'}
                </p>
            </div>
        </Card>
    );
}
