'use client';
import { useEffect, useRef, useState } from 'react';
import { useFirestore } from '@/firebase';
import { doc, setDoc, Timestamp } from 'firebase/firestore';
import type { ContentItem } from '@/lib/content-library-types';
import { Button } from '@/components/ui/button';
import { X, Download, ZoomIn, ZoomOut, ChevronLeft, ChevronRight } from 'lucide-react';

interface PDFViewerProps {
    content: ContentItem;
    learnerId: string;
    onClose?: () => void;
}

export function PDFViewer({ content, learnerId, onClose }: PDFViewerProps) {
    const firestore = useFirestore();
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [zoom, setZoom] = useState(100);
    const sessionStartTime = useRef<number>(Date.now());
    const maxPageReached = useRef<number>(1);
    const lastSaveTime = useRef<number>(Date.now());

    useEffect(() => {
        // Auto-save progress every 15 seconds
        const saveInterval = setInterval(() => {
            saveProgress();
        }, 15000);

        // Save on unmount
        return () => {
            clearInterval(saveInterval);
            saveProgress(true);
        };
    }, [currentPage]);

    useEffect(() => {
        // Track max page reached
        if (currentPage > maxPageReached.current) {
            maxPageReached.current = currentPage;
        }
    }, [currentPage]);

    const saveProgress = async (isClosing = false) => {
        if (!firestore || totalPages === 0) return;

        const progressId = `${content.id}_${learnerId}`;
        const progress = (maxPageReached.current / totalPages) * 100;
        const timeSpent = Math.round((Date.now() - sessionStartTime.current) / 1000);
        const isCompleted = progress >= 90; // Consider 90% as completed

        const progressData = {
            id: progressId,
            contentId: content.id,
            learnerId,
            status: isCompleted ? 'completed' : maxPageReached.current > 1 ? 'in-progress' : 'not-started',
            progress: Math.round(progress),
            timeSpent,
            lastPosition: String(currentPage),
            lastAccessedAt: Timestamp.now(),
            ...(isCompleted && !isClosing ? { completedAt: Timestamp.now() } : {}),
            ...(maxPageReached.current === 1 ? { startedAt: Timestamp.now() } : {}),
            attempts: 1,
        };

        try {
            await setDoc(doc(firestore, 'contentProgress', progressId), progressData, { merge: true });
        } catch (error) {
            console.error('Failed to save PDF progress:', error);
        }
    };

    const handleDownload = () => {
        window.open(content.fileUrl, '_blank');
    };

    const nextPage = () => {
        if (currentPage < totalPages) {
            setCurrentPage(currentPage + 1);
        }
    };

    const previousPage = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
        }
    };

    const zoomIn = () => {
        if (zoom < 200) {
            setZoom(zoom + 25);
        }
    };

    const zoomOut = () => {
        if (zoom > 50) {
            setZoom(zoom - 25);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-gray-900 flex flex-col">
            {/* Header */}
            <div className="bg-primary text-white p-4 flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold">{content.title}</h2>
                    <p className="text-sm text-white/70">PDF Document</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleDownload}
                        className="text-white hover:bg-white/10"
                    >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                    </Button>
                    {onClose && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                                saveProgress(true);
                                onClose();
                            }}
                            className="text-white hover:bg-white/10"
                        >
                            <X className="h-6 w-6" />
                        </Button>
                    )}
                </div>
            </div>

            {/* Toolbar */}
            <div className="bg-gray-800 text-white p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={previousPage}
                        disabled={currentPage === 1}
                        className="text-white hover:bg-white/10"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm font-mono px-3">
                        Page {currentPage} of {totalPages || '...'}
                    </span>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={nextPage}
                        disabled={currentPage === totalPages}
                        className="text-white hover:bg-white/10"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={zoomOut}
                        disabled={zoom === 50}
                        className="text-white hover:bg-white/10"
                    >
                        <ZoomOut className="h-4 w-4" />
                    </Button>
                    <span className="text-sm font-mono w-16 text-center">{zoom}%</span>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={zoomIn}
                        disabled={zoom === 200}
                        className="text-white hover:bg-white/10"
                    >
                        <ZoomIn className="h-4 w-4" />
                    </Button>
                </div>

                <div className="text-sm bg-accent/80 px-3 py-1 rounded-full">
                    {Math.round((maxPageReached.current / (totalPages || 1)) * 100)}% Complete
                </div>
            </div>

            {/* PDF Content */}
            <div className="flex-1 overflow-auto bg-gray-700 p-8">
                <div className="max-w-4xl mx-auto">
                    <iframe
                        src={`${content.fileUrl}#page=${currentPage}&zoom=${zoom}`}
                        className="w-full h-[calc(100vh-12rem)] bg-white rounded-lg shadow-xl"
                        title={content.title}
                        onLoad={(e) => {
                            // Try to detect total pages (this is a simplified approach)
                            // In a real app, you'd use a PDF library like PDF.js
                            setTotalPages(100); // Placeholder
                        }}
                    />
                </div>
            </div>
        </div>
    );
}
