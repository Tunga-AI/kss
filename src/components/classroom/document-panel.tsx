'use client';

import { useState, useMemo } from 'react';
import { useFirestore, useCollection, useUser } from '@/firebase';
import { collection, query, where, orderBy, addDoc, serverTimestamp } from 'firebase/firestore';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { FileText, Upload, Download, Share2, Loader2 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { SharedDocument } from '@/lib/classroom-types';

interface DocumentPanelProps {
    sessionId: string;
    isInstructor: boolean;
}

export function DocumentPanel({ sessionId, isInstructor }: DocumentPanelProps) {
    const firestore = useFirestore();
    const { user } = useUser();
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    const documentsQuery = useMemo(() => {
        if (!firestore) return null;
        return query(
            collection(firestore, 'sharedDocuments'),
            where('sessionId', '==', sessionId),
            where('sharedToClass', '==', true),
            orderBy('uploadedAt', 'desc')
        );
    }, [firestore, sessionId]);

    const { data: documents } = useCollection<SharedDocument>(documentsQuery as any);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !firestore || !user) return;

        // File size limit: 50MB
        if (file.size > 50 * 1024 * 1024) {
            toast({
                title: 'File too large',
                description: 'Maximum file size is 50MB',
                variant: 'destructive',
            });
            return;
        }

        setUploading(true);
        setUploadProgress(0);

        try {
            const storage = getStorage();
            const storageRef = ref(storage, `classroom/${sessionId}/${Date.now()}_${file.name}`);
            const uploadTask = uploadBytesResumable(storageRef, file);

            uploadTask.on(
                'state_changed',
                (snapshot) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    setUploadProgress(progress);
                },
                (error) => {
                    console.error('Upload error:', error);
                    toast({
                        title: 'Upload failed',
                        description: 'Failed to upload file. Please try again.',
                        variant: 'destructive',
                    });
                    setUploading(false);
                },
                async () => {
                    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

                    // Save to Firestore
                    await addDoc(collection(firestore, 'sharedDocuments'), {
                        sessionId,
                        fileName: file.name,
                        fileUrl: downloadURL,
                        fileType: file.type,
                        fileSize: file.size,
                        uploadedBy: user.uid,
                        uploadedByName: user.displayName || user.email || 'Anonymous',
                        uploadedAt: serverTimestamp(),
                        sharedToClass: true,
                    });

                    toast({
                        title: 'Document uploaded',
                        description: `${file.name} has been shared with the class`,
                    });

                    setUploading(false);
                    setUploadProgress(0);
                    e.target.value = '';
                }
            );
        } catch (error) {
            console.error('Error uploading file:', error);
            toast({
                title: 'Upload failed',
                description: 'Failed to upload file. Please try again.',
                variant: 'destructive',
            });
            setUploading(false);
        }
    };

    return (
        <div className="flex flex-col h-full">
            {isInstructor && (
                <div className="p-4 border-b border-primary/10">
                    <label htmlFor="file-upload">
                        <Button
                            type="button"
                            className="w-full bg-primary hover:bg-accent"
                            disabled={uploading}
                            onClick={() => document.getElementById('file-upload')?.click()}
                        >
                            {uploading ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Uploading...
                                </>
                            ) : (
                                <>
                                    <Upload className="h-4 w-4 mr-2" />
                                    Upload Document
                                </>
                            )}
                        </Button>
                    </label>
                    <input
                        id="file-upload"
                        type="file"
                        className="hidden"
                        onChange={handleFileUpload}
                        disabled={uploading}
                        accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.jpg,.jpeg,.png"
                    />
                    {uploading && (
                        <div className="mt-2">
                            <Progress value={uploadProgress} className="h-2" />
                            <p className="text-xs text-primary/60 mt-1 text-center">
                                {Math.round(uploadProgress)}%
                            </p>
                        </div>
                    )}
                </div>
            )}

            <ScrollArea className="flex-1 p-4">
                <div className="space-y-3">
                    {documents && documents.length > 0 ? (
                        documents.map((doc) => (
                            <DocumentItem key={doc.id} document={doc} />
                        ))
                    ) : (
                        <div className="text-center py-8">
                            <FileText className="h-12 w-12 mx-auto text-primary/20 mb-2" />
                            <p className="text-sm text-primary/40">No documents shared yet</p>
                            {isInstructor && (
                                <p className="text-xs text-primary/30 mt-1">Upload files to share with the class</p>
                            )}
                        </div>
                    )}
                </div>
            </ScrollArea>
        </div>
    );
}

function DocumentItem({ document }: { document: SharedDocument }) {
    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    const getFileIcon = (type: string) => {
        if (type.includes('pdf')) return '📄';
        if (type.includes('word') || type.includes('document')) return '📝';
        if (type.includes('sheet') || type.includes('excel')) return '📊';
        if (type.includes('presentation') || type.includes('powerpoint')) return '📽️';
        if (type.includes('image')) return '🖼️';
        return '📎';
    };

    return (
        <div className="p-3 rounded-lg border border-primary/10 hover:border-primary/20 hover:bg-primary/5 transition-colors">
            <div className="flex items-start gap-3">
                <div className="text-2xl shrink-0">{getFileIcon(document.fileType)}</div>
                <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-primary truncate">{document.fileName}</p>
                    <p className="text-xs text-primary/50 mt-1">
                        {formatFileSize(document.fileSize)} • {document.uploadedByName}
                    </p>
                    <p className="text-[10px] text-primary/40 mt-1">
                        {document.uploadedAt && format(document.uploadedAt.toDate(), 'MMM d, h:mm a')}
                    </p>
                </div>
                <Button
                    size="sm"
                    variant="outline"
                    className="shrink-0"
                    onClick={() => window.open(document.fileUrl, '_blank')}
                >
                    <Download className="h-3 w-3" />
                </Button>
            </div>
        </div>
    );
}
