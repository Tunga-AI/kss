'use client';
import { useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, FileText, Video, Package, ImageIcon, Music, Download, Calendar, HardDrive, Tag } from "lucide-react";
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, where, limit } from 'firebase/firestore';
import type { ContentItem } from '@/lib/content-library-types';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function ContentPreviewPage() {
    const params = useParams();
    const router = useRouter();
    const firestore = useFirestore();
    const id = params.id as string;

    const contentQuery = useMemo(() => { // Query by ID (document ID)
        if (!firestore || !id) return null;
        // Use document ID query
        return query(collection(firestore, 'contentLibrary'), where('__name__', '==', id), limit(1));
    }, [firestore, id]);

    const { data: contentItems, loading } = useCollection<ContentItem>(contentQuery as any);
    const content = contentItems?.[0];

    if (loading) {
        return <div className="p-8 flex justify-center">Loading...</div>;
    }

    if (!content) {
        return (
            <div className="p-8 text-center">
                <h1 className="text-xl font-bold mb-4">Content Not Found</h1>
                <Button onClick={() => router.back()}>Go Back</Button>
            </div>
        );
    }

    const renderPreview = () => {
        switch (content.type) {
            case 'video':
                return (
                    <div className="aspect-video bg-black rounded-lg overflow-hidden flex items-center justify-center">
                        <video controls className="w-full h-full" src={content.fileUrl}>
                            Your browser does not support the video tag.
                        </video>
                    </div>
                );
            case 'image':
                return (
                    <div className="flex justify-center bg-gray-100 rounded-lg p-4 overflow-hidden relative min-h-[300px]">
                        <img
                            src={content.fileUrl}
                            alt={content.title}
                            className="max-w-full max-h-[80vh] object-contain rounded shadow-lg"
                        />
                    </div>
                );
            case 'audio':
                return (
                    <div className="bg-gray-100 p-8 rounded-lg flex flex-col items-center justify-center min-h-[200px]">
                        <Music className="h-16 w-16 text-primary mb-4 opacity-50" />
                        <audio controls className="w-full max-w-md" src={content.fileUrl}>
                            Your browser does not support the audio element.
                        </audio>
                    </div>
                );
            case 'document':
                // For PDF, iframe works well. 
                const isPdf = content.mimeType === 'application/pdf' || content.fileName.toLowerCase().endsWith('.pdf');
                if (isPdf) {
                    return (
                        <iframe src={content.fileUrl} className="w-full h-[80vh] border rounded-lg bg-white" title="PDF Preview" />
                    );
                }
                // Fallback for non-PDF documents
                return (
                    <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-12 text-center min-h-[300px] flex flex-col items-center justify-center">
                        <FileText className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                        <p className="text-lg font-medium text-gray-900 mb-2">Detailed preview not available for this document type.</p>
                        <p className="text-sm text-gray-500 mb-6">File Type: {content.mimeType}</p>
                        <Button asChild variant="outline" className="mt-4">
                            <a href={content.fileUrl} target="_blank" rel="noopener noreferrer">
                                <Download className="mr-2 h-4 w-4" /> Download to View
                            </a>
                        </Button>
                    </div>
                );
            default:
                return (
                    <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-12 text-center min-h-[300px] flex flex-col items-center justify-center">
                        <Package className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                        <p className="text-lg font-medium text-gray-900 mb-2">Preview not available for {content.type}.</p>
                        <Button asChild variant="outline" className="mt-4">
                            <a href={content.fileUrl} target="_blank" rel="noopener noreferrer">
                                <Download className="mr-2 h-4 w-4" /> Download
                            </a>
                        </Button>
                    </div>
                );
        }
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <div className="min-h-screen bg-gray-50/50 p-4 md:p-8 font-body">
            <div className="container mx-auto max-w-7xl space-y-6">

                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => router.back()} className="h-10 w-10">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div>
                            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900 line-clamp-1" title={content.title}>
                                {content.title}
                            </h1>
                            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground mt-1">
                                <Badge variant="secondary" className="uppercase text-[10px] tracking-wider font-bold">{content.type}</Badge>
                                <span className="hidden sm:inline">•</span>
                                <span>{formatFileSize(content.fileSize)}</span>
                                <span className="hidden sm:inline">•</span>
                                <span className="capitalize">{content.status}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button onClick={() => router.push((content as any).type === 'course' ? `/a/library/create?id=${content.id}` : `/a/library/${content.id}/edit`)} variant="outline">
                            Edit
                        </Button>
                        <Button asChild>
                            <a href={content.fileUrl} download target="_blank" rel="noopener noreferrer">
                                <Download className="mr-2 h-4 w-4" />
                                <span className="hidden sm:inline">Download</span>
                            </a>
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        {/* Content Preview */}
                        <Card className="overflow-hidden border-0 shadow-lg rounded-xl">
                            <CardContent className="p-0 bg-black/5 min-h-[400px] flex items-center justify-center relative">
                                {renderPreview()}
                            </CardContent>
                        </Card>

                        {/* Metadata Details */}
                        <Card className="rounded-xl shadow-sm border-gray-100">
                            <CardHeader>
                                <CardTitle className="text-lg">Content Details</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-2">
                                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Description</h3>
                                    <p className="text-gray-700 leading-relaxed">
                                        {content.description || 'No description provided.'}
                                    </p>
                                </div>

                                <Separator />

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                            <Calendar className="h-3 w-3" /> Created
                                        </div>
                                        <p className="font-medium text-gray-900 pl-5">
                                            {content.createdAt ? format(content.createdAt.toDate(), 'PPP p') : 'N/A'}
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                            <HardDrive className="h-3 w-3" /> Mime Type
                                        </div>
                                        <p className="font-medium text-gray-900 pl-5 font-mono text-sm">{content.mimeType || 'Unknown'}</p>
                                    </div>
                                </div>

                                {content.tags && content.tags.length > 0 && (
                                    <>
                                        <Separator />
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                                <Tag className="h-3 w-3" /> Tags
                                            </div>
                                            <div className="flex flex-wrap gap-2 pl-5">
                                                {content.tags.map(tag => (
                                                    <Badge key={tag} variant="outline" className="bg-gray-50">{tag}</Badge>
                                                ))}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    <div className="space-y-6">
                        {/* Sidebar: File Info */}
                        <Card className="rounded-xl shadow-sm border-gray-100">
                            <CardHeader>
                                <CardTitle className="text-base font-bold uppercase tracking-wider text-muted-foreground">File Info</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 text-sm">
                                <div className="flex justify-between items-center py-2 border-b border-gray-50">
                                    <span className="text-muted-foreground">Filename</span>
                                    <span className="font-medium truncate max-w-[150px] text-gray-900" title={content.fileName}>{content.fileName}</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-gray-50">
                                    <span className="text-muted-foreground">Size</span>
                                    <span className="font-medium text-gray-900">{formatFileSize(content.fileSize)}</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-gray-50">
                                    <span className="text-muted-foreground">Version</span>
                                    <span className="font-medium text-gray-900">v{content.version || 1}</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-gray-50">
                                    <span className="text-muted-foreground">Status</span>
                                    <Badge variant={content.status === 'published' ? 'default' : 'secondary'} className="capitalize">{content.status}</Badge>
                                </div>
                                <div className="flex justify-between items-center py-2">
                                    <span className="text-muted-foreground">Downloads</span>
                                    <span className="font-medium text-gray-900">{content.downloadCount || 0}</span>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Sidebar: Usage Info */}
                        <Card className="rounded-xl shadow-sm border-gray-100">
                            <CardHeader>
                                <CardTitle className="text-base font-bold uppercase tracking-wider text-muted-foreground">Usage in Courses</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {content.usedInCourses && content.usedInCourses.length > 0 ? (
                                    <div className="space-y-3">
                                        <p className="text-xs text-muted-foreground mb-2">This content is used in {content.usedInCourses.length} course(s).</p>
                                        <ul className="space-y-2">
                                            {content.usedInCourses.map(courseId => (
                                                <li key={courseId} className="bg-gray-50 p-3 rounded-lg border border-gray-100 text-sm flex items-center gap-2">
                                                    <div className="h-2 w-2 rounded-full bg-green-500"></div>
                                                    <span className="truncate flex-1">Course ID: {courseId}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ) : (
                                    <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                                        <Package className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                                        <p className="text-sm text-gray-500">Not used in any courses yet.</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
