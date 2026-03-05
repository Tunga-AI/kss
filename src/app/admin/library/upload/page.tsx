'use client';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useFirestore, useUser } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { ArrowLeft, Upload, RefreshCw, FileText, Video, Package, Image as ImageIcon, Music, ChevronDown, Trash2 } from "lucide-react";
import { toast } from '@/components/ui/use-toast';
import type { ContentType, ContentStatus } from '@/lib/content-library-types';

interface FileData {
    id: string;
    file: File;
    title: string;
    description: string;
    contentType: ContentType;
    status: ContentStatus;
    tags: string;
    visibility: 'public' | 'restricted' | 'private';
    progress: number;
    status_msg?: string;
    uploaded: boolean;
    error?: boolean;
}

export default function UploadContentPage() {
    const router = useRouter();
    const firestore = useFirestore();
    const { user } = useUser();

    const [uploading, setUploading] = useState(false);
    const [filesData, setFilesData] = useState<FileData[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const newFiles: FileData[] = Array.from(e.target.files).map(file => {
                let contentType: ContentType = 'document';
                const fileType = file.type;
                if (fileType.startsWith('video/')) {
                    contentType = 'video';
                } else if (fileType.startsWith('image/')) {
                    contentType = 'image';
                } else if (fileType.startsWith('audio/')) {
                    contentType = 'audio';
                } else if (fileType === 'application/pdf' || fileType.includes('document')) {
                    contentType = 'document';
                } else if (file.name.endsWith('.zip')) {
                    contentType = 'scorm';
                }

                return {
                    id: Math.random().toString(36).substring(7),
                    file,
                    title: file.name.replace(/\.[^/.]+$/, ''),
                    description: '',
                    contentType,
                    status: 'draft',
                    tags: '',
                    visibility: 'public',
                    progress: 0,
                    uploaded: false,
                    error: false
                };
            });

            setFilesData(prev => [...prev, ...newFiles]);
        }

        // Reset the input so the same files can be selected again if needed
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const updateFileData = (id: string, field: keyof FileData, value: any) => {
        setFilesData(prev => prev.map(f => f.id === id ? { ...f, [field]: value } : f));
    };

    const removeFile = (id: string) => {
        setFilesData(prev => prev.filter(f => f.id !== id));
    };

    const handleUploadAll = async (e: React.FormEvent) => {
        e.preventDefault();

        if (filesData.length === 0 || !firestore || !user) {
            toast({
                title: 'Error',
                description: 'Please select files and ensure you are logged in',
                variant: 'destructive',
            });
            return;
        }

        const pendingFiles = filesData.filter(f => !f.uploaded);
        if (pendingFiles.length === 0) {
            toast({ title: 'Info', description: 'All files are already uploaded.' });
            return;
        }

        setUploading(true);
        let allSuccess = true;

        for (const fileData of pendingFiles) {
            try {
                const storage = getStorage();
                const fileName = `${Date.now()}_${fileData.file.name}`;
                const storageRef = ref(storage, `content-library/${fileData.contentType}/${fileName}`);

                const uploadTask = uploadBytesResumable(storageRef, fileData.file);

                await new Promise<void>((resolve, reject) => {
                    uploadTask.on(
                        'state_changed',
                        (snapshot) => {
                            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                            updateFileData(fileData.id, 'progress', progress);
                            updateFileData(fileData.id, 'status_msg', 'Uploading...');
                        },
                        (error) => {
                            console.error('Upload error:', error);
                            updateFileData(fileData.id, 'status_msg', `Error: ${error.message}`);
                            updateFileData(fileData.id, 'error', true);
                            reject(error);
                        },
                        async () => {
                            try {
                                const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

                                const contentData = {
                                    title: fileData.title,
                                    description: fileData.description,
                                    type: fileData.contentType,
                                    status: fileData.status,
                                    fileUrl: downloadURL,
                                    fileName: fileData.file.name,
                                    fileSize: fileData.file.size,
                                    mimeType: fileData.file.type,
                                    categories: [],
                                    tags: fileData.tags.split(',').map(t => t.trim()).filter(t => t),
                                    visibility: fileData.visibility,
                                    createdAt: serverTimestamp(),
                                    updatedAt: serverTimestamp(),
                                    createdBy: user.id,
                                    version: 1,
                                    viewCount: 0,
                                    downloadCount: 0,
                                    usedInCourses: [],
                                };

                                if (fileData.contentType === 'scorm') {
                                    (contentData as any).scormData = {
                                        version: '1.2',
                                        manifestUrl: downloadURL,
                                        launchUrl: downloadURL,
                                        identifier: `scorm_${Date.now()}`,
                                    };
                                }

                                if (fileData.contentType === 'video') {
                                    const video = document.createElement('video');
                                    video.preload = 'metadata';

                                    await new Promise<void>((videoResolve, videoReject) => {
                                        video.onloadedmetadata = async function () {
                                            try {
                                                (contentData as any).videoData = { duration: video.duration };
                                                await addDoc(collection(firestore, 'contentLibrary'), contentData);
                                                videoResolve();
                                            } catch (err) {
                                                videoReject(err);
                                            }
                                        };
                                        video.onerror = async function () {
                                            // Fallback if metadata loading fails
                                            try {
                                                await addDoc(collection(firestore, 'contentLibrary'), contentData);
                                                videoResolve();
                                            } catch (err) {
                                                videoReject(err);
                                            }
                                        };
                                        video.src = downloadURL;
                                    });
                                    resolve();
                                } else {
                                    await addDoc(collection(firestore, 'contentLibrary'), contentData);
                                    resolve();
                                }
                            } catch (err) {
                                reject(err);
                            }
                        }
                    );
                });

                updateFileData(fileData.id, 'uploaded', true);
                updateFileData(fileData.id, 'status_msg', 'Success');
                updateFileData(fileData.id, 'error', false);
            } catch (error) {
                allSuccess = false;
                console.error('Error uploading file', fileData.file.name, error);
                updateFileData(fileData.id, 'status_msg', 'Upload failed');
                updateFileData(fileData.id, 'error', true);
            }
        }

        setUploading(false);
        if (allSuccess) {
            toast({
                title: 'Success',
                description: 'All files uploaded successfully',
            });
            router.push('/a/library');
        } else {
            toast({
                title: 'Warning',
                description: 'Some files failed to upload. Please check the list.',
                variant: 'destructive',
            });
        }
    };

    const getFileIcon = (type: ContentType) => {
        switch (type) {
            case 'video': return <Video className="h-8 w-8" />;
            case 'document': return <FileText className="h-8 w-8" />;
            case 'scorm': return <Package className="h-8 w-8" />;
            case 'image': return <ImageIcon className="h-8 w-8" />;
            case 'audio': return <Music className="h-8 w-8" />;
            default: return <FileText className="h-8 w-8" />;
        }
    };

    return (
        <div className="w-full min-h-screen bg-gray-50/50 p-2 md:p-4 font-body">
            <div className="w-full max-w-5xl mx-auto">
                {/* Hero Section */}
                <div className="bg-primary text-white p-6 mb-6 border-b border-primary/10 rounded-tl-3xl rounded-br-3xl rounded-tr-none rounded-bl-none shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-accent/20 rounded-full blur-3xl opacity-20" />

                    <div className="relative z-10">
                        <Button
                            variant="ghost"
                            onClick={() => router.back()}
                            className="mb-4 gap-2 text-white/80 hover:text-white hover:bg-white/10"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back to Library
                        </Button>

                        <div className="flex items-center gap-3 mb-2">
                            <Upload className="h-8 w-8 bg-accent/20 p-1.5 rounded-lg text-accent" />
                            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Upload Content</h1>
                        </div>
                        <p className="text-white/80 text-lg font-medium">Add multiple videos, documents, images, and SCORM packages to your library</p>
                    </div>
                </div>

                {/* Global File Upload Dropzone */}
                {!uploading && (
                    <div className="w-full bg-white shadow-lg border border-primary/10 overflow-hidden rounded-tl-2xl rounded-br-2xl rounded-tr-none rounded-bl-none p-6 mb-8">
                        <div className="space-y-4">
                            <Label className="text-sm font-bold text-primary/80 uppercase tracking-widest">Select Files</Label>
                            <div className="relative">
                                <input
                                    type="file"
                                    multiple
                                    onChange={handleFileSelect}
                                    ref={fileInputRef}
                                    className="hidden"
                                    id="file-upload"
                                    accept="*/*"
                                />
                                <label
                                    htmlFor="file-upload"
                                    className="flex flex-col items-center justify-center w-full h-40 border-2 border-primary/20 border-dashed rounded-tl-2xl rounded-br-2xl rounded-tr-none rounded-bl-none cursor-pointer bg-primary/5 hover:bg-primary/10 transition-all"
                                >
                                    <div className="flex flex-col items-center text-center p-4">
                                        <Upload className="h-10 w-10 text-primary/40 mb-3" />
                                        <p className="text-lg font-bold text-primary mb-1">Click to upload or drag and drop</p>
                                        <p className="text-sm text-primary/60">Select multiple files at once</p>
                                    </div>
                                </label>
                            </div>
                        </div>
                    </div>
                )}

                {/* List of Files Form */}
                {filesData.length > 0 && (
                    <form onSubmit={handleUploadAll} className="space-y-6">
                        <div className="flex items-center justify-between px-2 mb-2">
                            <h2 className="text-xl font-bold text-primary">File Details ({filesData.length})</h2>
                            <p className="text-sm text-primary/60">Please provide details for each file before uploading.</p>
                        </div>

                        {filesData.map((f, index) => (
                            <div key={f.id} className={`w-full bg-white shadow-md border overflow-hidden rounded-tl-2xl rounded-br-2xl rounded-tr-none rounded-bl-none p-6 ${f.error ? 'border-red-300 bg-red-50/10' : 'border-primary/10'}`}>
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 border-b border-primary/10 pb-4 gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className="h-14 w-14 bg-accent/10 rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none flex items-center justify-center text-accent shrink-0">
                                            {getFileIcon(f.contentType)}
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="font-bold text-lg text-primary truncate max-w-xs sm:max-w-md">{f.file.name}</h3>
                                            <p className="text-sm text-primary/60">{(f.file.size / (1024 * 1024)).toFixed(2)} MB</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {f.uploaded && <span className="text-green-500 font-bold px-3 py-1 bg-green-50 rounded-full text-sm">Uploaded</span>}
                                        {f.error && <span className="text-red-500 font-bold px-3 py-1 bg-red-50 rounded-full text-sm">{f.status_msg || 'Error'}</span>}
                                        {!f.uploaded && !f.error && f.progress > 0 && <span className="text-accent font-bold px-3 py-1 bg-accent/10 rounded-full text-sm">Uploading {Math.round(f.progress)}%</span>}

                                        {!f.uploaded && !uploading && (
                                            <Button type="button" variant="ghost" onClick={() => removeFile(f.id)} className="text-red-500 hover:text-red-700 hover:bg-red-50">
                                                <Trash2 className="h-4 w-4 mr-2" />
                                                Remove
                                            </Button>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                                    {/* Left Column */}
                                    <div className="space-y-4 lg:col-span-7">
                                        <div className="space-y-2">
                                            <Label htmlFor={`title-${f.id}`} className="text-xs font-bold text-primary/80 uppercase">Content Title <span className="text-red-500">*</span></Label>
                                            <Input
                                                id={`title-${f.id}`}
                                                value={f.title}
                                                onChange={(e) => updateFileData(f.id, 'title', e.target.value)}
                                                placeholder="Enter content title"
                                                required
                                                disabled={uploading || f.uploaded}
                                                className="h-11 rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none placeholder:text-gray-400"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor={`desc-${f.id}`} className="text-xs font-bold text-primary/80 uppercase">Description <span className="text-red-500">*</span></Label>
                                            <Textarea
                                                id={`desc-${f.id}`}
                                                value={f.description}
                                                onChange={(e) => updateFileData(f.id, 'description', e.target.value)}
                                                placeholder="Describe the content"
                                                rows={3}
                                                required
                                                disabled={uploading || f.uploaded}
                                                className="rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none resize-none placeholder:text-gray-400"
                                            />
                                        </div>
                                    </div>

                                    {/* Right Column */}
                                    <div className="space-y-4 lg:col-span-5">
                                        <div className="space-y-2">
                                            <Label htmlFor={`type-${f.id}`} className="text-xs font-bold text-primary/80 uppercase">Content Type</Label>
                                            <div className="relative">
                                                <select
                                                    id={`type-${f.id}`}
                                                    value={f.contentType}
                                                    onChange={(e) => updateFileData(f.id, 'contentType', e.target.value as ContentType)}
                                                    disabled={uploading || f.uploaded}
                                                    className={`w-full appearance-none bg-white border border-primary/10 rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none px-4 py-2.5 text-sm font-bold text-primary focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all ${uploading || f.uploaded ? 'opacity-70 bg-gray-50' : 'cursor-pointer'}`}
                                                >
                                                    <option value="video">Video</option>
                                                    <option value="document">Document (PDF, DOCX, etc.)</option>
                                                    <option value="scorm">SCORM Package</option>
                                                    <option value="h5p">H5P Interactive</option>
                                                    <option value="xapi">xAPI Content</option>
                                                    <option value="image">Image</option>
                                                    <option value="audio">Audio</option>
                                                    <option value="link">External Link</option>
                                                </select>
                                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/30 pointer-events-none" />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor={`tags-${f.id}`} className="text-xs font-bold text-primary/80 uppercase">Tags</Label>
                                            <Input
                                                id={`tags-${f.id}`}
                                                value={f.tags}
                                                onChange={(e) => updateFileData(f.id, 'tags', e.target.value)}
                                                placeholder="e.g., programming, python"
                                                disabled={uploading || f.uploaded}
                                                className="h-11 rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none placeholder:text-gray-400"
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-2">
                                                <Label htmlFor={`vis-${f.id}`} className="text-xs font-bold text-primary/80 uppercase truncate">Visibility</Label>
                                                <div className="relative">
                                                    <select
                                                        id={`vis-${f.id}`}
                                                        value={f.visibility}
                                                        onChange={(e) => updateFileData(f.id, 'visibility', e.target.value)}
                                                        disabled={uploading || f.uploaded}
                                                        className={`w-full appearance-none bg-white border border-primary/10 rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none px-3 py-2.5 text-sm font-bold text-primary focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all ${uploading || f.uploaded ? 'opacity-70 bg-gray-50' : 'cursor-pointer'}`}
                                                    >
                                                        <option value="public">Public</option>
                                                        <option value="restricted">Restricted</option>
                                                        <option value="private">Private</option>
                                                    </select>
                                                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-primary/30 pointer-events-none" />
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor={`status-${f.id}`} className="text-xs font-bold text-primary/80 uppercase truncate">Status</Label>
                                                <div className="relative">
                                                    <select
                                                        id={`status-${f.id}`}
                                                        value={f.status}
                                                        onChange={(e) => updateFileData(f.id, 'status', e.target.value as ContentStatus)}
                                                        disabled={uploading || f.uploaded}
                                                        className={`w-full appearance-none bg-white border border-primary/10 rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none px-3 py-2.5 text-sm font-bold text-primary focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all ${uploading || f.uploaded ? 'opacity-70 bg-gray-50' : 'cursor-pointer'}`}
                                                    >
                                                        <option value="draft">Draft</option>
                                                        <option value="published">Published</option>
                                                        <option value="archived">Archived</option>
                                                    </select>
                                                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-primary/30 pointer-events-none" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Upload Progress Bar inside the card */}
                                {uploading && !f.uploaded && (
                                    <div className="mt-5 space-y-1">
                                        <div className="w-full h-1.5 bg-primary/10 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full transition-all duration-300 ${f.error ? 'bg-red-500' : 'bg-accent'}`}
                                                style={{ width: `${Math.max(2, f.progress)}%` }}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}

                        {/* Sticky Action Footer */}
                        <div className="sticky bottom-4 z-20 mt-8 mb-4">
                            <div className="bg-white/90 backdrop-blur-md shadow-2xl border border-primary/10 rounded-tl-2xl rounded-br-2xl p-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
                                <p className="text-sm font-bold text-primary/70">
                                    {filesData.filter(f => !f.uploaded).length} remaining to upload
                                </p>
                                <div className="flex gap-4 w-full sm:w-auto">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => router.back()}
                                        disabled={uploading}
                                        className="flex-1 sm:flex-none h-12 px-8 rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none font-bold"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={uploading || filesData.every(f => f.uploaded)}
                                        className="flex-1 sm:flex-none h-12 px-8 bg-accent hover:bg-accent/90 text-white rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none font-bold shadow-lg shadow-accent/20"
                                    >
                                        {uploading ? (
                                            <>
                                                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                                Uploading All...
                                            </>
                                        ) : (
                                            <>
                                                <Upload className="h-4 w-4 mr-2" />
                                                Upload {filesData.filter(f => !f.uploaded).length} File{filesData.filter(f => !f.uploaded).length !== 1 ? 's' : ''}
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
