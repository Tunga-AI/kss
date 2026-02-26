'use client';
import { useMemo, use } from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, RefreshCw, FileText, Download, Play, Users } from "lucide-react";
import { useFirestore, useDoc, useCollection } from '@/firebase';
import { doc, collection, query, where } from 'firebase/firestore';
import type { LearningUnit, UnitProgress } from '@/lib/learning-types';
import type { ContentItem } from '@/lib/content-library-types';

export default function StaffUnitDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const firestore = useFirestore();

    // Fetch unit
    const unitDoc = useMemo(() => {
        if (!firestore) return null;
        return doc(firestore, 'learningUnits', id);
    }, [firestore, id]);
    const { data: unit, loading: unitLoading } = useDoc<LearningUnit>(unitDoc);

    // Fetch unit progress (learners)
    const progressQuery = useMemo(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'unitProgress'), where('unitId', '==', id));
    }, [firestore, id]);
    const { data: progressRecords, loading: progressLoading } = useCollection<UnitProgress>(progressQuery);

    // Fetch content items
    const contentIds = unit?.contentIds || [];
    const contentQuery = useMemo(() => {
        if (!firestore || contentIds.length === 0) return null;
        return query(collection(firestore, 'contentLibrary'), where('__name__', 'in', contentIds.slice(0, 10)));
    }, [firestore, contentIds]);
    const { data: contentItems } = useCollection<ContentItem>(contentQuery);

    // Calculate stats
    const stats = useMemo(() => {
        if (!progressRecords) return { total: 0, completed: 0, inProgress: 0, notStarted: 0, averageProgress: 0 };
        const total = progressRecords.length;
        const completed = progressRecords.filter(p => p.status === 'Completed' || p.status === 'Passed').length;
        const inProgress = progressRecords.filter(p => p.status === 'In Progress').length;
        const notStarted = progressRecords.filter(p => p.status === 'Not Started').length;
        const totalProgress = progressRecords.reduce((sum, p) => sum + p.progress, 0);
        const averageProgress = total > 0 ? Math.round(totalProgress / total) : 0;
        return { total, completed, inProgress, notStarted, averageProgress };
    }, [progressRecords]);

    if (unitLoading || progressLoading) {
        return (
            <div className="p-8 flex items-center justify-center min-h-screen">
                <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!unit) {
        return (
            <div className="p-8 flex items-center justify-center min-h-screen">
                <p className="text-primary/60">Unit not found</p>
            </div>
        );
    }

    return (
        <div className="w-full min-h-screen bg-gray-50/50 p-2 md:p-4 font-body">
            <div className="w-full max-w-7xl mx-auto">
                {/* Back link */}
                <div className="flex items-center gap-4 mb-6">
                    <Button variant="ghost" size="sm" asChild className="rounded-tl-lg rounded-br-lg">
                        <Link href={unit.courseId ? `/f/curriculum/${unit.courseId}` : '/f/curriculum'}>
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Course
                        </Link>
                    </Button>
                </div>

                {/* Unit Info Card */}
                <Card className="border-primary/10 shadow-lg rounded-tl-2xl rounded-br-2xl rounded-tr-none rounded-bl-none mb-6">
                    <CardHeader className="border-b border-primary/10 bg-primary/5">
                        <div className="flex justify-between items-start">
                            <div>
                                <CardTitle className="text-primary text-2xl">{unit.title}</CardTitle>
                                {unit.description && <CardDescription className="mt-2">{unit.description}</CardDescription>}
                            </div>
                            <Badge variant="outline" className="rounded-tl-md rounded-br-md">{unit.status}</Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-primary/5 p-4 rounded-tl-lg rounded-br-lg">
                                <p className="text-[10px] uppercase font-black tracking-widest text-primary/60 mb-1">Estimated Duration</p>
                                <p className="font-bold text-primary text-xl">{unit.estimatedDuration || 60} min</p>
                            </div>
                            <div className="bg-primary/5 p-4 rounded-tl-lg rounded-br-lg">
                                <p className="text-[10px] uppercase font-black tracking-widest text-primary/60 mb-1">Passing Score</p>
                                <p className="font-bold text-primary text-xl">{unit.passingScore || 70}%</p>
                            </div>
                            <div className="bg-primary/5 p-4 rounded-tl-lg rounded-br-lg">
                                <p className="text-[10px] uppercase font-black tracking-widest text-primary/60 mb-1">Required</p>
                                <p className="font-bold text-primary text-xl">{unit.isRequired ? 'Yes' : 'No'}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Learner Progress Stats */}
                <Card className="border-primary/10 shadow-lg rounded-tl-2xl rounded-br-2xl rounded-tr-none rounded-bl-none mb-6">
                    <CardHeader className="border-b border-primary/10 bg-primary/5">
                        <CardTitle className="text-primary flex items-center gap-2">
                            <Users className="h-5 w-5" />
                            Learner Progress
                        </CardTitle>
                        <CardDescription>Overview of learner engagement with this unit</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            <div className="bg-blue-50 p-4 rounded-tl-lg rounded-br-lg border border-blue-200">
                                <p className="text-[10px] uppercase font-black tracking-widest text-blue-600 mb-1">Total Learners</p>
                                <p className="font-bold text-blue-600 text-2xl">{stats.total}</p>
                            </div>
                            <div className="bg-green-50 p-4 rounded-tl-lg rounded-br-lg border border-green-200">
                                <p className="text-[10px] uppercase font-black tracking-widest text-green-600 mb-1">Completed</p>
                                <p className="font-bold text-green-600 text-2xl">{stats.completed}</p>
                            </div>
                            <div className="bg-yellow-50 p-4 rounded-tl-lg rounded-br-lg border border-yellow-200">
                                <p className="text-[10px] uppercase font-black tracking-widest text-yellow-600 mb-1">In Progress</p>
                                <p className="font-bold text-yellow-600 text-2xl">{stats.inProgress}</p>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-tl-lg rounded-br-lg border border-gray-200">
                                <p className="text-[10px] uppercase font-black tracking-widest text-gray-600 mb-1">Not Started</p>
                                <p className="font-bold text-gray-600 text-2xl">{stats.notStarted}</p>
                            </div>
                            <div className="bg-purple-50 p-4 rounded-tl-lg rounded-br-lg border border-purple-200">
                                <p className="text-[10px] uppercase font-black tracking-widest text-purple-600 mb-1">Avg Progress</p>
                                <p className="font-bold text-purple-600 text-2xl">{stats.averageProgress}%</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Content Materials */}
                <Card className="border-primary/10 shadow-lg rounded-tl-2xl rounded-br-2xl rounded-tr-none rounded-bl-none">
                    <CardHeader className="border-b border-primary/10 bg-primary/5">
                        <CardTitle className="text-primary flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            Course Materials
                        </CardTitle>
                        <CardDescription>Content items for this unit</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6">
                        {contentItems && contentItems.length > 0 ? (
                            <div className="space-y-3">
                                {contentItems.map((content) => (
                                    <Card key={content.id} className="border-primary/10 hover:border-accent/50 transition-colors">
                                        <CardContent className="p-4">
                                            <div className="flex justify-between items-center">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-12 w-12 flex items-center justify-center rounded-tl-lg rounded-br-lg bg-primary/10 text-primary">
                                                        <FileText className="h-6 w-6" />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-primary">{content.title}</p>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <Badge variant="outline" className="text-xs rounded-tl-sm rounded-br-sm">{content.type}</Badge>
                                                            <span className="text-xs text-primary/60">{(content.fileSize / 1024 / 1024).toFixed(2)} MB</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    {content.fileUrl && (
                                                        <>
                                                            <Button size="sm" variant="outline" className="rounded-tl-md rounded-br-md" onClick={() => window.open(content.fileUrl, '_blank')}>
                                                                <Play className="h-4 w-4 mr-1" />
                                                                View
                                                            </Button>
                                                            <Button size="sm" variant="outline" className="rounded-tl-md rounded-br-md" onClick={() => {
                                                                const link = document.createElement('a');
                                                                link.href = content.fileUrl;
                                                                link.download = content.fileName;
                                                                link.click();
                                                            }}>
                                                                <Download className="h-4 w-4" />
                                                            </Button>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                            {content.description && (
                                                <p className="text-sm text-primary/60 mt-3">{content.description}</p>
                                            )}
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-10">
                                <FileText className="h-12 w-12 text-primary/10 mx-auto mb-2" />
                                <p className="text-primary/40 font-bold uppercase tracking-widest text-xs">No materials added yet</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
