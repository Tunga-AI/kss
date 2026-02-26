'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
    BarChart3,
    TrendingUp,
    Users,
    Clock,
    CheckCircle,
    XCircle,
    RefreshCw,
    ArrowLeft,
    Download,
    Eye,
    Play,
    FileText,
    Package,
    Video,
    Award,
    Target,
    Activity
} from "lucide-react";
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import type { ContentItem, ContentProgress, SCORMAttempt } from '@/lib/content-library-types';
import { cn } from "@/lib/utils";

export default function ContentAnalyticsPage() {
    const firestore = useFirestore();
    const [dateRange, setDateRange] = useState('7d'); // 7d, 30d, 90d, all

    // Fetch all content
    const contentQuery = useMemo(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'contentLibrary'), orderBy('createdAt', 'desc'));
    }, [firestore]);

    const { data: allContent, loading: contentLoading } = useCollection<ContentItem>(contentQuery as any);

    // Fetch all content progress
    const progressQuery = useMemo(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'contentProgress'), orderBy('lastAccessedAt', 'desc'));
    }, [firestore]);

    const { data: allProgress, loading: progressLoading } = useCollection<ContentProgress>(progressQuery as any);

    // Fetch all SCORM attempts
    const scormQuery = useMemo(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'scormAttempts'), orderBy('lastAttemptAt', 'desc'));
    }, [firestore]);

    const { data: allScormAttempts, loading: scormLoading } = useCollection<SCORMAttempt>(scormQuery as any);

    // Calculate analytics
    const analytics = useMemo(() => {
        if (!allContent || !allProgress) return null;

        const totalContent = allContent.length;
        const publishedContent = allContent.filter(c => c.status === 'published').length;
        const totalLearners = new Set(allProgress.map(p => p.learnerId)).size;

        // Completion metrics
        const completedProgress = allProgress.filter(p => p.status === 'completed');
        const inProgressCount = allProgress.filter(p => p.status === 'in-progress').length;
        const completionRate = allProgress.length > 0
            ? (completedProgress.length / allProgress.length) * 100
            : 0;

        // Time metrics
        const totalTimeSpent = allProgress.reduce((sum, p) => sum + (p.timeSpent || 0), 0);
        const avgTimePerContent = allProgress.length > 0
            ? totalTimeSpent / allProgress.length
            : 0;

        // Content type breakdown
        const contentByType = allContent.reduce((acc, content) => {
            acc[content.type] = (acc[content.type] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        // Top performing content
        const contentPerformance = allContent.map(content => {
            const contentProgress = allProgress.filter(p => p.contentId === content.id);
            const views = contentProgress.length;
            const completions = contentProgress.filter(p => p.status === 'completed').length;
            const completionRate = views > 0 ? (completions / views) * 100 : 0;
            const avgProgress = views > 0
                ? contentProgress.reduce((sum, p) => sum + p.progress, 0) / views
                : 0;
            const totalTime = contentProgress.reduce((sum, p) => sum + (p.timeSpent || 0), 0);

            return {
                content,
                views,
                completions,
                completionRate,
                avgProgress,
                totalTime,
            };
        }).sort((a, b) => b.views - a.views);

        // SCORM specific metrics
        const scormMetrics = allScormAttempts?.reduce((acc, attempt) => {
            const status = attempt.cmi.core.lesson_status;
            acc.total += 1;
            if (status === 'passed') acc.passed += 1;
            if (status === 'failed') acc.failed += 1;
            if (status === 'completed') acc.completed += 1;
            acc.totalScore += attempt.cmi.core.score_raw || 0;
            acc.totalTime += attempt.timeSpent || 0;
            return acc;
        }, { total: 0, passed: 0, failed: 0, completed: 0, totalScore: 0, totalTime: 0 }) || { total: 0, passed: 0, failed: 0, completed: 0, totalScore: 0, totalTime: 0 };

        const scormPassRate = scormMetrics.total > 0
            ? (scormMetrics.passed / scormMetrics.total) * 100
            : 0;
        const scormAvgScore = scormMetrics.total > 0
            ? scormMetrics.totalScore / scormMetrics.total
            : 0;

        return {
            totalContent,
            publishedContent,
            totalLearners,
            completionRate,
            inProgressCount,
            totalTimeSpent,
            avgTimePerContent,
            contentByType,
            topContent: contentPerformance.slice(0, 10),
            scormMetrics,
            scormPassRate,
            scormAvgScore,
        };
    }, [allContent, allProgress, allScormAttempts]);

    const formatTime = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        if (hours > 0) return `${hours}h ${mins}m`;
        return `${mins}m`;
    };

    const getContentIcon = (type: string) => {
        switch (type) {
            case 'video': return <Video className="h-4 w-4" />;
            case 'document': return <FileText className="h-4 w-4" />;
            case 'scorm': return <Package className="h-4 w-4" />;
            default: return <FileText className="h-4 w-4" />;
        }
    };

    if (contentLoading || progressLoading || scormLoading) {
        return (
            <div className="p-8 flex items-center justify-center min-h-screen">
                <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!analytics) {
        return (
            <div className="p-8 text-center">
                <p className="text-primary/40">No analytics data available</p>
            </div>
        );
    }

    return (
        <div className="w-full min-h-screen bg-gray-50/50 p-2 md:p-4 font-body">
            <div className="w-full">
                {/* Hero Section */}
                <div className="bg-primary text-white p-6 mb-6 border-b border-primary/10 rounded-tl-3xl rounded-br-3xl rounded-tr-none rounded-bl-none shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-accent/20 rounded-full blur-3xl opacity-20" />

                    <div className="relative z-10">
                        <div className="flex items-center gap-4 mb-4">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="text-white hover:bg-white/10 rounded-tl-md rounded-br-md rounded-tr-none rounded-bl-none"
                                asChild
                            >
                                <Link href="/admin/library">
                                    <ArrowLeft className="h-5 w-5" />
                                </Link>
                            </Button>
                            <div className="flex items-center gap-3">
                                <BarChart3 className="h-8 w-8 bg-accent/20 p-1.5 rounded-lg text-accent" />
                                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Content Analytics</h1>
                            </div>
                        </div>
                        <p className="text-white/80 text-lg font-medium ml-16">Performance insights and usage metrics</p>
                    </div>
                </div>

                {/* Key Metrics Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                    {/* Total Content */}
                    <Card className="rounded-tl-2xl rounded-br-2xl rounded-tr-none rounded-bl-none border-primary/10 hover:shadow-lg transition-all">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-widest text-primary/40 mb-2">Total Content</p>
                                    <p className="text-3xl font-bold text-primary">{analytics.totalContent}</p>
                                    <p className="text-xs text-primary/60 mt-1">{analytics.publishedContent} published</p>
                                </div>
                                <div className="h-12 w-12 bg-primary/10 rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none flex items-center justify-center">
                                    <FileText className="h-6 w-6 text-primary" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Total Learners */}
                    <Card className="rounded-tl-2xl rounded-br-2xl rounded-tr-none rounded-bl-none border-primary/10 hover:shadow-lg transition-all">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-widest text-primary/40 mb-2">Active Learners</p>
                                    <p className="text-3xl font-bold text-primary">{analytics.totalLearners}</p>
                                    <p className="text-xs text-primary/60 mt-1">Engaged users</p>
                                </div>
                                <div className="h-12 w-12 bg-accent/10 rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none flex items-center justify-center">
                                    <Users className="h-6 w-6 text-accent" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Completion Rate */}
                    <Card className="rounded-tl-2xl rounded-br-2xl rounded-tr-none rounded-bl-none border-primary/10 hover:shadow-lg transition-all">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-widest text-primary/40 mb-2">Completion Rate</p>
                                    <p className="text-3xl font-bold text-primary">{analytics.completionRate.toFixed(1)}%</p>
                                    <p className="text-xs text-primary/60 mt-1">{analytics.inProgressCount} in progress</p>
                                </div>
                                <div className="h-12 w-12 bg-green-500/10 rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none flex items-center justify-center">
                                    <CheckCircle className="h-6 w-6 text-green-500" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Total Time */}
                    <Card className="rounded-tl-2xl rounded-br-2xl rounded-tr-none rounded-bl-none border-primary/10 hover:shadow-lg transition-all">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-widest text-primary/40 mb-2">Total Time Spent</p>
                                    <p className="text-3xl font-bold text-primary">{formatTime(analytics.totalTimeSpent)}</p>
                                    <p className="text-xs text-primary/60 mt-1">Avg: {formatTime(analytics.avgTimePerContent)}</p>
                                </div>
                                <div className="h-12 w-12 bg-purple-500/10 rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none flex items-center justify-center">
                                    <Clock className="h-6 w-6 text-purple-500" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* SCORM Metrics */}
                {analytics.scormMetrics.total > 0 && (
                    <div className="mb-6">
                        <Card className="rounded-tl-2xl rounded-br-2xl rounded-tr-none rounded-bl-none border-primary/10">
                            <CardHeader className="border-b border-primary/10 bg-primary/5">
                                <div className="flex items-center gap-3">
                                    <Package className="h-6 w-6 text-accent" />
                                    <CardTitle className="text-xl font-bold text-primary">SCORM Performance</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-widest text-primary/40 mb-2">Total Attempts</p>
                                        <p className="text-2xl font-bold text-primary">{analytics.scormMetrics.total}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-widest text-primary/40 mb-2">Passed</p>
                                        <p className="text-2xl font-bold text-green-500">{analytics.scormMetrics.passed}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-widest text-primary/40 mb-2">Failed</p>
                                        <p className="text-2xl font-bold text-red-500">{analytics.scormMetrics.failed}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-widest text-primary/40 mb-2">Pass Rate</p>
                                        <p className="text-2xl font-bold text-primary">{analytics.scormPassRate.toFixed(1)}%</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-widest text-primary/40 mb-2">Avg Score</p>
                                        <p className="text-2xl font-bold text-accent">{analytics.scormAvgScore.toFixed(0)}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Content Type Breakdown */}
                <div className="mb-6">
                    <Card className="rounded-tl-2xl rounded-br-2xl rounded-tr-none rounded-bl-none border-primary/10">
                        <CardHeader className="border-b border-primary/10 bg-primary/5">
                            <div className="flex items-center gap-3">
                                <Activity className="h-6 w-6 text-accent" />
                                <CardTitle className="text-xl font-bold text-primary">Content Distribution</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                                {Object.entries(analytics.contentByType).map(([type, count]) => (
                                    <div key={type} className="flex items-center gap-3 p-3 bg-primary/5 rounded-tl-lg rounded-br-lg rounded-tr-none rounded-bl-none">
                                        <div className="h-10 w-10 bg-primary/10 rounded-tl-md rounded-br-md rounded-tr-none rounded-bl-none flex items-center justify-center">
                                            {getContentIcon(type)}
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-primary/60 uppercase">{type}</p>
                                            <p className="text-lg font-bold text-primary">{count}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Top Performing Content */}
                <div className="mb-6">
                    <Card className="rounded-tl-2xl rounded-br-2xl rounded-tr-none rounded-bl-none border-primary/10">
                        <CardHeader className="border-b border-primary/10 bg-primary/5">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <TrendingUp className="h-6 w-6 text-accent" />
                                    <CardTitle className="text-xl font-bold text-primary">Top Performing Content</CardTitle>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="rounded-tl-md rounded-br-md rounded-tr-none rounded-bl-none"
                                >
                                    <Download className="h-4 w-4 mr-2" />
                                    Export
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader className="bg-primary/5 border-b border-primary/10">
                                    <TableRow className="hover:bg-transparent">
                                        <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest">Rank</TableHead>
                                        <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest">Content</TableHead>
                                        <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest">Type</TableHead>
                                        <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest text-center">Views</TableHead>
                                        <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest text-center">Completions</TableHead>
                                        <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest text-center">Completion %</TableHead>
                                        <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest text-center">Avg Progress</TableHead>
                                        <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest text-center">Total Time</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody className="divide-y divide-primary/10">
                                    {analytics.topContent.map((item, index) => (
                                        <TableRow key={item.content.id} className="hover:bg-primary/5 transition-colors group border-primary/10">
                                            <TableCell className="px-6 py-4">
                                                <Badge className={cn(
                                                    "rounded-tl-sm rounded-br-sm rounded-tr-none rounded-bl-none font-bold",
                                                    index === 0 ? "bg-yellow-500 text-white" :
                                                    index === 1 ? "bg-gray-400 text-white" :
                                                    index === 2 ? "bg-orange-600 text-white" :
                                                    "bg-primary/10 text-primary"
                                                )}>
                                                    {index === 0 && <Award className="h-3 w-3 mr-1" />}
                                                    #{index + 1}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-8 w-8 bg-primary/10 rounded-tl-md rounded-br-md rounded-tr-none rounded-bl-none flex items-center justify-center flex-shrink-0">
                                                        {getContentIcon(item.content.type)}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-primary text-sm">{item.content.title}</p>
                                                        <p className="text-xs text-primary/60">{item.content.description.slice(0, 60)}...</p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="px-6 py-4">
                                                <Badge className={cn(
                                                    "rounded-tl-sm rounded-br-sm rounded-tr-none rounded-bl-none font-bold text-[9px] uppercase",
                                                    item.content.type === 'video' ? 'bg-purple-500 text-white' :
                                                    item.content.type === 'scorm' ? 'bg-accent text-white' :
                                                    'bg-primary text-white'
                                                )}>
                                                    {item.content.type}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="px-6 py-4 text-center">
                                                <div className="flex items-center justify-center gap-1">
                                                    <Eye className="h-3 w-3 text-primary/40" />
                                                    <span className="font-bold text-primary">{item.views}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="px-6 py-4 text-center">
                                                <div className="flex items-center justify-center gap-1">
                                                    <CheckCircle className="h-3 w-3 text-green-500" />
                                                    <span className="font-bold text-primary">{item.completions}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="px-6 py-4 text-center">
                                                <Badge className={cn(
                                                    "rounded-tl-sm rounded-br-sm rounded-tr-none rounded-bl-none font-bold",
                                                    item.completionRate >= 70 ? "bg-green-500 text-white" :
                                                    item.completionRate >= 40 ? "bg-yellow-500 text-white" :
                                                    "bg-red-500 text-white"
                                                )}>
                                                    {item.completionRate.toFixed(0)}%
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="px-6 py-4 text-center">
                                                <div className="w-full max-w-[100px] mx-auto bg-primary/10 rounded-full h-2">
                                                    <div
                                                        className="bg-accent h-2 rounded-full transition-all"
                                                        style={{ width: `${item.avgProgress}%` }}
                                                    />
                                                </div>
                                                <span className="text-xs text-primary/60 mt-1 block">{item.avgProgress.toFixed(0)}%</span>
                                            </TableCell>
                                            <TableCell className="px-6 py-4 text-center">
                                                <div className="flex items-center justify-center gap-1">
                                                    <Clock className="h-3 w-3 text-primary/40" />
                                                    <span className="font-bold text-primary">{formatTime(item.totalTime)}</span>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
