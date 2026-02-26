'use client';
import { useState, useMemo, use, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
    ArrowLeft,
    RefreshCw,
    CheckCircle,
    FileText,
    Video,
    Clock,
    User,
    Download,
    ExternalLink,
    BookOpen,
    Monitor,
    MapPin
} from "lucide-react";
import { useFirestore, useDoc, useCollection, useUser } from '@/firebase';
import { doc, collection, query, where } from 'firebase/firestore';
import type { LearningUnit, UnitProgress } from '@/lib/learning-types';
import type { ContentItem } from '@/lib/content-library-types';
import { cn } from "@/lib/utils";
import {
    getUnitProgressByLearnerAndUnit,
    createUnitProgress,
    updateUnitProgress,
    updateEnrollmentProgress
} from '@/lib/learning';
import { Timestamp } from 'firebase/firestore';

export default function LearnerUnitPage({ params }: { params: Promise<{ unitId: string }> }) {
    const { unitId } = use(params);
    const searchParams = useSearchParams();
    const enrollmentId = searchParams.get('enrollment');
    const firestore = useFirestore();
    const { user } = useUser();

    const [activeContentId, setActiveContentId] = useState<string | null>(null);
    const [unitProgress, setUnitProgress] = useState<UnitProgress | null>(null);
    const [loadingProgress, setLoadingProgress] = useState(true);
    const [markingComplete, setMarkingComplete] = useState(false);

    // Fetch unit
    const unitDoc = useMemo(() => {
        if (!firestore) return null;
        return doc(firestore, 'learningUnits', unitId);
    }, [firestore, unitId]);
    const { data: unit, loading: unitLoading } = useDoc<LearningUnit>(unitDoc);

    // Fetch content items for this unit
    const contentIds = unit?.contentIds || [];
    const contentQuery = useMemo(() => {
        if (!firestore || contentIds.length === 0) return null;
        return query(
            collection(firestore, 'contentLibrary'),
            where('__name__', 'in', contentIds.slice(0, 10))
        );
    }, [firestore, contentIds]);
    const { data: contentItems, loading: contentLoading } = useCollection<ContentItem>(contentQuery);

    // Sorted content items maintain order from contentIds
    const sortedContent = useMemo(() => {
        if (!contentItems || !contentIds.length) return [];
        return contentIds
            .map(id => contentItems.find(c => c.id === id))
            .filter(Boolean) as ContentItem[];
    }, [contentItems, contentIds]);

    // Active content
    const activeContent = sortedContent.find(c => c.id === activeContentId) || sortedContent[0];

    // Fetch and handle unit progress
    useEffect(() => {
        if (!firestore || !user || !unitId || !enrollmentId) return;

        const fetchProgress = async () => {
            try {
                setLoadingProgress(true);
                let progress = await getUnitProgressByLearnerAndUnit(firestore, user.uid, unitId);

                if (!progress) {
                    // Create new progress record
                    const progressId = await createUnitProgress(firestore, {
                        unitId,
                        learnerId: user.uid,
                        courseId: unit?.courseId || '',
                        enrollmentId,
                        status: 'In Progress',
                        progress: 0,
                        completedContentIds: [],
                        contentProgress: {},
                        timeSpent: 0,
                        attempts: 1,
                        passed: false,
                        startedAt: Timestamp.now(),
                        lastAccessedAt: Timestamp.now(),
                    });

                    progress = {
                        id: progressId,
                        unitId,
                        learnerId: user.uid,
                        courseId: unit?.courseId || '',
                        enrollmentId,
                        status: 'In Progress',
                        progress: 0,
                        completedContentIds: [],
                        contentProgress: {},
                        timeSpent: 0,
                        attempts: 1,
                        passed: false,
                    } as UnitProgress;
                }

                setUnitProgress(progress);
            } catch (error) {
                console.error('Error fetching progress:', error);
            } finally {
                setLoadingProgress(false);
            }
        };

        fetchProgress();
    }, [firestore, user, unitId, enrollmentId, unit?.courseId]);

    // Set first content as active
    useEffect(() => {
        if (sortedContent.length > 0 && !activeContentId) {
            setActiveContentId(sortedContent[0].id);
        }
    }, [sortedContent, activeContentId]);

    const handleMarkContentComplete = async (contentId: string) => {
        if (!firestore || !unitProgress) return;

        try {
            const completedContentIds = [...(unitProgress.completedContentIds || [])];
            if (!completedContentIds.includes(contentId)) {
                completedContentIds.push(contentId);
            }

            const contentProgress = { ...(unitProgress.contentProgress || {}) };
            contentProgress[contentId] = {
                status: 'completed',
                progress: 100,
                timeSpent: 0,
                lastAccessedAt: Timestamp.now(),
            };

            const progress = Math.round((completedContentIds.length / contentIds.length) * 100);

            await updateUnitProgress(firestore, unitProgress.id, {
                completedContentIds,
                contentProgress,
                progress,
                lastAccessedAt: Timestamp.now(),
            });

            setUnitProgress({
                ...unitProgress,
                completedContentIds,
                contentProgress,
                progress,
            });
        } catch (error) {
            console.error('Error marking content complete:', error);
        }
    };

    const handleMarkUnitComplete = async () => {
        if (!firestore || !unitProgress || !enrollmentId) return;

        try {
            setMarkingComplete(true);

            await updateUnitProgress(firestore, unitProgress.id, {
                status: 'Completed',
                progress: 100,
                passed: true,
                completedAt: Timestamp.now(),
            });

            // Update enrollment progress
            await updateEnrollmentProgress(firestore, enrollmentId);

            setUnitProgress({
                ...unitProgress,
                status: 'Completed',
                progress: 100,
                passed: true,
            });
        } catch (error) {
            console.error('Error marking unit complete:', error);
        } finally {
            setMarkingComplete(false);
        }
    };

    const isContentCompleted = (contentId: string) => {
        return unitProgress?.completedContentIds?.includes(contentId) || false;
    };

    const getContentTypeIcon = (type: string) => {
        switch (type) {
            case 'video': return <Video className="h-5 w-5 text-purple-500" />;
            case 'document': return <FileText className="h-5 w-5 text-blue-500" />;
            case 'image': return <FileText className="h-5 w-5 text-green-500" />;
            default: return <FileText className="h-5 w-5 text-gray-500" />;
        }
    };

    if (unitLoading || contentLoading || loadingProgress) {
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
            <div className="max-w-[1600px] mx-auto">
                {/* Top Navigation */}
                <div className="mb-4 flex items-center justify-between">
                    <Button
                        variant="ghost"
                        size="sm"
                        asChild
                        className="rounded-tl-lg rounded-br-lg hover:bg-white/50"
                        disabled={!unit?.courseId}
                    >
                        <Link href={unit?.courseId ? `/dashboard/curriculum/${unit.courseId}?enrollment=${enrollmentId}` : '#'}>
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Course
                        </Link>
                    </Button>
                </div>

                {/* Unit Hero Header */}
                <div className="bg-primary text-white p-6 md:p-8 rounded-tl-3xl rounded-br-3xl rounded-tr-none rounded-bl-none shadow-2xl relative overflow-hidden mb-6">
                    <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-accent/20 rounded-full blur-3xl opacity-20" />
                    <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-8 items-end">
                        <div className="lg:col-span-2">
                            <div className="flex items-center gap-2 mb-4">
                                {unit.weekNumber && (
                                    <Badge variant="secondary" className="bg-white/10 text-white hover:bg-white/20 border-none rounded-tl-md rounded-br-md backdrop-blur-sm">
                                        Week {unit.weekNumber}
                                    </Badge>
                                )}
                                <Badge
                                    variant="outline"
                                    className={cn(
                                        "rounded-tl-md rounded-br-md border-white/20 text-white backdrop-blur-sm",
                                        unit.deliveryType === 'Virtual' && "bg-blue-500/20",
                                        unit.deliveryType === 'Physical' && "bg-green-500/20"
                                    )}
                                >
                                    {unit.deliveryType === 'Virtual' && <Monitor className="h-3 w-3 mr-1.5" />}
                                    {unit.deliveryType === 'Physical' && <MapPin className="h-3 w-3 mr-1.5" />}
                                    {unit.deliveryType || 'Virtual'}
                                </Badge>
                                <div className="flex items-center gap-1 text-xs font-medium text-white/60 ml-2">
                                    <Clock className="h-3.5 w-3.5" />
                                    <span>{unit.estimatedDuration} min</span>
                                </div>
                            </div>

                            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white mb-2">{unit.title}</h1>
                            {unit.description && (
                                <p className="text-white/70 text-base md:text-lg max-w-2xl leading-relaxed">{unit.description}</p>
                            )}

                            <div className="flex flex-wrap items-center gap-6 mt-6 text-sm text-white/50">
                                {unit.facilitatorName && (
                                    <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
                                        <User className="h-4 w-4" />
                                        <span>Instructor: <span className="text-white/80">{unit.facilitatorName}</span></span>
                                    </div>
                                )}
                                <div className="flex items-center gap-2">
                                    <FileText className="h-4 w-4" />
                                    <span>{sortedContent.length} materials</span>
                                </div>
                            </div>
                        </div>

                        <div className="lg:col-span-1 flex flex-col items-end gap-4">
                            {/* Progress Card */}
                            <div className="bg-white/10 backdrop-blur-md p-4 rounded-tl-xl rounded-br-xl w-full border border-white/10">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs font-bold text-white/80 uppercase tracking-widest">Unit Progress</span>
                                    <span className="text-lg font-bold text-accent">{unitProgress?.progress || 0}%</span>
                                </div>
                                <Progress value={unitProgress?.progress || 0} className="h-2 bg-white/10" indicatorClassName="bg-accent" />
                            </div>

                            {/* Action Button */}
                            {unitProgress?.status !== 'Completed' ? (
                                <Button
                                    onClick={handleMarkUnitComplete}
                                    disabled={markingComplete}
                                    size="lg"
                                    className="w-full bg-accent hover:bg-accent/90 text-white rounded-tl-xl rounded-br-xl shadow-lg border-none"
                                >
                                    {markingComplete ? (
                                        <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                                    ) : (
                                        <CheckCircle className="h-5 w-5 mr-2" />
                                    )}
                                    Mark Unit Complete
                                </Button>
                            ) : (
                                <div className="w-full bg-green-500/20 border border-green-500/30 p-3 rounded-tl-xl rounded-br-xl flex items-center justify-center gap-2 text-green-100 font-bold backdrop-blur-sm">
                                    <CheckCircle className="h-5 w-5" />
                                    <span>Unit Completed</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Main Content Viewer */}
                    <div className="lg:col-span-3 space-y-6">
                        {activeContent ? (
                            <Card className="border-primary/10 shadow-lg rounded-tl-2xl rounded-br-2xl overflow-hidden bg-white">
                                <div className="border-b border-primary/10 bg-gray-50/50 p-4 flex items-center justify-between flex-wrap gap-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-primary/5 rounded-lg text-primary">
                                            {getContentTypeIcon(activeContent.type)}
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-bold text-primary leading-tight">{activeContent.title}</h2>
                                            <p className="text-xs text-primary/50 font-medium uppercase tracking-wider mt-0.5">{activeContent.type}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {!isContentCompleted(activeContent.id) ? (
                                            <Button
                                                size="sm"
                                                onClick={() => handleMarkContentComplete(activeContent.id)}
                                                variant="outline"
                                                className="rounded-tl-lg rounded-br-lg border-primary/20 hover:bg-primary hover:text-white transition-colors"
                                            >
                                                <CheckCircle className="h-4 w-4 mr-2" />
                                                Mark Read
                                            </Button>
                                        ) : (
                                            <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200 h-9 px-3 rounded-tl-lg rounded-br-lg">
                                                <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                                                Read
                                            </Badge>
                                        )}

                                        {activeContent.type === 'document' && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                asChild
                                                className="rounded-tl-lg rounded-br-lg border-primary/20"
                                            >
                                                <a href={activeContent.fileUrl} download>
                                                    <Download className="h-4 w-4 mr-2" />
                                                    Download
                                                </a>
                                            </Button>
                                        )}
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            asChild
                                            className="rounded-tl-lg rounded-br-lg text-primary/60 hover:text-primary"
                                        >
                                            <a href={activeContent.fileUrl} target="_blank" rel="noopener noreferrer">
                                                <ExternalLink className="h-4 w-4" />
                                            </a>
                                        </Button>
                                    </div>
                                </div>

                                <CardContent className="p-0 bg-black/5 min-h-[500px] flex flex-col justify-center">
                                    {/* Video Player */}
                                    {activeContent.type === 'video' && (
                                        <div className="aspect-video bg-black w-full h-full">
                                            <video
                                                controls
                                                className="w-full h-full"
                                                src={activeContent.fileUrl}
                                                poster={activeContent.thumbnailUrl}
                                            >
                                                Your browser does not support the video tag.
                                            </video>
                                        </div>
                                    )}

                                    {/* PDF Viewer */}
                                    {activeContent.type === 'document' && activeContent.mimeType === 'application/pdf' && (
                                        <div className="h-[800px] w-full bg-gray-100">
                                            <iframe
                                                src={`${activeContent.fileUrl}#toolbar=1&navpanes=1&scrollbar=1`}
                                                className="w-full h-full"
                                                title={activeContent.title}
                                            />
                                        </div>
                                    )}

                                    {/* Other Documents */}
                                    {activeContent.type === 'document' && activeContent.mimeType !== 'application/pdf' && (
                                        <div className="p-16 text-center bg-white flex flex-col items-center justify-center h-full">
                                            <div className="bg-primary/5 p-6 rounded-full mb-6">
                                                <FileText className="h-12 w-12 text-primary" />
                                            </div>
                                            <h3 className="text-xl font-bold text-primary mb-2">View Document</h3>
                                            <p className="text-primary/60 mb-8 max-w-md mx-auto">This document type cannot be previewed directly in the browser. Please download it to view the content.</p>
                                            <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-white rounded-tl-xl rounded-br-xl shadow-lg">
                                                <a href={activeContent.fileUrl} download>
                                                    <Download className="h-5 w-5 mr-2" />
                                                    Download File
                                                </a>
                                            </Button>
                                        </div>
                                    )}

                                    {/* Image Viewer */}
                                    {activeContent.type === 'image' && (
                                        <div className="p-4 flex items-center justify-center bg-gray-100 h-full min-h-[500px]">
                                            <img
                                                src={activeContent.fileUrl}
                                                alt={activeContent.title}
                                                className="max-w-full max-h-[700px] object-contain shadow-lg rounded-lg"
                                            />
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ) : (
                            <Card className="border-primary/10 shadow-lg rounded-tl-2xl rounded-br-2xl bg-white h-[400px] flex items-center justify-center">
                                <CardContent className="text-center">
                                    <div className="bg-primary/5 p-4 rounded-full inline-block mb-4">
                                        <BookOpen className="h-10 w-10 text-primary/40" />
                                    </div>
                                    <h3 className="text-lg font-bold text-primary mb-2">No Content Selected</h3>
                                    <p className="text-primary/60">Select an item from the list to view</p>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Sidebar - Course Materials */}
                    <div className="lg:col-span-1">
                        <Card className="border-primary/10 shadow-xl rounded-tl-2xl rounded-br-2xl sticky top-6 overflow-hidden bg-white">
                            <CardHeader className="border-b border-primary/10 bg-primary text-white p-5">
                                <CardTitle className="text-lg font-bold">Materials</CardTitle>
                                <CardDescription className="text-white/60 text-xs mt-1">
                                    {unitProgress?.completedContentIds?.length || 0} / {sortedContent.length} completed
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="max-h-[calc(100vh-300px)] overflow-y-auto custom-scrollbar">
                                    {sortedContent.length > 0 ? (
                                        <div className="divide-y divide-gray-100">
                                            {sortedContent.map((content, index) => {
                                                const isCompleted = isContentCompleted(content.id);
                                                const isActive = activeContentId === content.id;
                                                const Icon = content.type === 'video' ? Video : content.type === 'image' ? FileText : FileText;

                                                return (
                                                    <button
                                                        key={content.id}
                                                        onClick={() => setActiveContentId(content.id)}
                                                        className={cn(
                                                            "w-full p-4 text-left transition-all flex gap-3 relative group",
                                                            isActive
                                                                ? "bg-accent/5"
                                                                : "hover:bg-gray-50"
                                                        )}
                                                    >
                                                        {isActive && (
                                                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-accent" />
                                                        )}

                                                        <div className="flex-shrink-0 mt-1">
                                                            {isCompleted ? (
                                                                <div className="h-5 w-5 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                                                                    <CheckCircle className="h-3.5 w-3.5" />
                                                                </div>
                                                            ) : (
                                                                <div className={cn(
                                                                    "h-5 w-5 rounded-full border flex items-center justify-center text-[10px] font-bold",
                                                                    isActive ? "border-accent text-accent" : "border-gray-200 text-gray-400 group-hover:border-gray-300"
                                                                )}>
                                                                    {index + 1}
                                                                </div>
                                                            )}
                                                        </div>

                                                        <div className="flex-1 min-w-0">
                                                            <p className={cn(
                                                                "text-sm font-medium leading-tight mb-1 truncate",
                                                                isActive ? "text-primary" : "text-gray-700"
                                                            )}>
                                                                {content.title}
                                                            </p>
                                                            <div className="flex items-center gap-2 text-xs text-gray-400">
                                                                <span className="flex items-center gap-1 capitalize">
                                                                    <Icon className="h-3 w-3" />
                                                                    {content.type}
                                                                </span>
                                                                {content.type === 'video' && content.videoData?.duration && (
                                                                    <>
                                                                        <span>•</span>
                                                                        <span>{Math.round(content.videoData.duration / 60)}m</span>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="p-8 text-center text-gray-400">
                                            <p className="text-sm">No materials available</p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
