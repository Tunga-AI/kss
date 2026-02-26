'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useFirestore, useUser } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { ArrowLeft, Upload, RefreshCw, FileText, Video, Package, Image as ImageIcon, Music, ChevronDown } from "lucide-react";
import { toast } from '@/components/ui/use-toast';
import type { ContentType, ContentStatus } from '@/lib/content-library-types';

export default function StaffUploadContentPage() {
    const router = useRouter();
    const firestore = useFirestore();
    const { user } = useUser();
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    // Form state
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [contentType, setContentType] = useState<ContentType>('document');
    const [status, setStatus] = useState<ContentStatus>('draft');
    const [tags, setTags] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [visibility, setVisibility] = useState<'public' | 'restricted' | 'private'>('public');

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setSelectedFile(file);

            // Auto-detect content type
            const fileType = file.type;
            if (fileType.startsWith('video/')) {
                setContentType('video');
            } else if (fileType.startsWith('image/')) {
                setContentType('image');
            } else if (fileType.startsWith('audio/')) {
                setContentType('audio');
            } else if (fileType === 'application/pdf' || fileType.includes('document')) {
                setContentType('document');
            } else if (file.name.endsWith('.zip')) {
                setContentType('scorm');
            }

            // Auto-fill title from filename if empty
            if (!title) {
                const fileName = file.name.replace(/\.[^/.]+$/, ''); // Remove extension
                setTitle(fileName);
            }
        }
    };

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedFile || !firestore || !user) {
            toast({
                title: 'Error',
                description: 'Please select a file and ensure you are logged in',
                variant: 'destructive',
            });
            return;
        }

        setUploading(true);
        setUploadProgress(0);

        setUploading(true);
        setUploadProgress(0); // Optional: you can simulate fake progress or just leave it at 0/indeterminant

        try {
            const storage = getStorage();
            const fileName = `${Date.now()}_${selectedFile.name}`;
            const storageRef = ref(storage, `content-library/${contentType}/${fileName}`);

            // Upload file using uploadBytes (simple upload, matches Admin Settings)
            await uploadBytes(storageRef, selectedFile);

            // Get URL
            const downloadURL = await getDownloadURL(storageRef);

            // Create content item
            const contentData = {
                title,
                description,
                type: contentType,
                status,
                fileUrl: downloadURL,
                fileName: selectedFile.name,
                fileSize: selectedFile.size,
                mimeType: selectedFile.type,
                categories: [],
                tags: tags.split(',').map(t => t.trim()).filter(t => t),
                visibility,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                createdBy: user.id,
                version: 1,
                viewCount: 0,
                downloadCount: 0,
                usedInCourses: [],
            };

            // Add SCORM-specific processing if needed
            if (contentType === 'scorm') {
                (contentData as any).scormData = {
                    version: '1.2',
                    manifestUrl: downloadURL,
                    launchUrl: downloadURL, // This should be parsed from manifest
                    identifier: `scorm_${Date.now()}`,
                };
            }

            // Add video-specific processing
            if (contentType === 'video') {
                // Create video element to get duration
                const video = document.createElement('video');
                video.preload = 'metadata';
                video.onloadedmetadata = async function () {
                    (contentData as any).videoData = {
                        duration: video.duration,
                    };

                    // Save to Firestore
                    await addDoc(collection(firestore, 'contentLibrary'), contentData);

                    toast({
                        title: 'Success',
                        description: 'Content uploaded successfully',
                    });

                    router.push('/f/library');
                };
                video.src = downloadURL;
            } else {
                // Save to Firestore
                await addDoc(collection(firestore, 'contentLibrary'), contentData);

                toast({
                    title: 'Success',
                    description: 'Content uploaded successfully',
                });

                router.push('/f/library');
            }

            setUploading(false);

        } catch (error: any) {
            console.error('Error uploading:', error);
            toast({
                title: 'Upload failed',
                description: error.message || 'An error occurred during upload',
                variant: 'destructive',
            });
            setUploading(false);
        }
    };

    const getFileIcon = () => {
        switch (contentType) {
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
            <div className="w-full">
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
                        <p className="text-white/80 text-lg font-medium">Add videos, documents, SCORM packages and more to your library</p>
                    </div>
                </div>

                {/* Upload Form */}
                <form onSubmit={handleUpload}>
                    <div className="w-full bg-white shadow-lg border border-primary/10 overflow-hidden rounded-tl-2xl rounded-br-2xl rounded-tr-none rounded-bl-none p-8">
                        <div className="max-w-3xl mx-auto space-y-6">
                            {/* File Upload */}
                            <div className="space-y-2">
                                <Label className="text-sm font-bold text-primary/80 uppercase tracking-widest">Select File</Label>
                                <div className="relative">
                                    <input
                                        type="file"
                                        onChange={handleFileSelect}
                                        className="hidden"
                                        id="file-upload"
                                        accept="*/*"
                                    />
                                    <label
                                        htmlFor="file-upload"
                                        className="flex flex-col items-center justify-center w-full h-64 border-2 border-primary/20 border-dashed rounded-tl-2xl rounded-br-2xl rounded-tr-none rounded-bl-none cursor-pointer bg-primary/5 hover:bg-primary/10 transition-all"
                                    >
                                        {selectedFile ? (
                                            <div className="flex flex-col items-center">
                                                <div className="h-16 w-16 bg-accent/20 rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none flex items-center justify-center text-accent mb-4">
                                                    {getFileIcon()}
                                                </div>
                                                <p className="text-lg font-bold text-primary mb-1">{selectedFile.name}</p>
                                                <p className="text-sm text-primary/60">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                                                <Button type="button" variant="ghost" className="mt-4 text-accent" size="sm">
                                                    Change File
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center">
                                                <Upload className="h-12 w-12 text-primary/40 mb-4" />
                                                <p className="text-lg font-bold text-primary mb-2">Click to upload or drag and drop</p>
                                                <p className="text-sm text-primary/60">Videos, Documents, SCORM, Images, Audio</p>
                                            </div>
                                        )}
                                    </label>
                                </div>
                            </div>

                            {/* Title */}
                            <div className="space-y-2">
                                <Label htmlFor="title" className="text-sm font-bold text-primary/80 uppercase tracking-widest">Content Title</Label>
                                <Input
                                    id="title"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Enter content title"
                                    required
                                    className="h-12 rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none"
                                />
                            </div>

                            {/* Description */}
                            <div className="space-y-2">
                                <Label htmlFor="description" className="text-sm font-bold text-primary/80 uppercase tracking-widest">Description</Label>
                                <Textarea
                                    id="description"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Describe the content"
                                    rows={4}
                                    required
                                    className="rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none"
                                />
                            </div>

                            {/* Content Type */}
                            <div className="space-y-2">
                                <Label htmlFor="contentType" className="text-sm font-bold text-primary/80 uppercase tracking-widest">Content Type</Label>
                                <div className="relative">
                                    <select
                                        id="contentType"
                                        value={contentType}
                                        onChange={(e) => setContentType(e.target.value as ContentType)}
                                        className="w-full appearance-none bg-white border border-primary/10 rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none px-4 py-3 text-base font-bold text-primary focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all cursor-pointer"
                                    >
                                        <option value="video">Video</option>
                                        <option value="document">Document (PDF, DOCX, etc.)</option>
                                        <option value="scorm">SCORM Package</option>
                                        <option value="h5p">H5P Interactive</option>
                                        <option value="xapi">xAPI Content</option>
                                        <option value="image">Image</option>
                                        <option value="audio">Audio</option>
                                    </select>
                                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/30 pointer-events-none" />
                                </div>
                            </div>

                            {/* Tags */}
                            <div className="space-y-2">
                                <Label htmlFor="tags" className="text-sm font-bold text-primary/80 uppercase tracking-widest">Tags (comma-separated)</Label>
                                <Input
                                    id="tags"
                                    value={tags}
                                    onChange={(e) => setTags(e.target.value)}
                                    placeholder="e.g., programming, python, beginner"
                                    className="h-12 rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none"
                                />
                            </div>

                            {/* Visibility */}
                            <div className="space-y-2">
                                <Label htmlFor="visibility" className="text-sm font-bold text-primary/80 uppercase tracking-widest">Visibility</Label>
                                <div className="relative">
                                    <select
                                        id="visibility"
                                        value={visibility}
                                        onChange={(e) => setVisibility(e.target.value as any)}
                                        className="w-full appearance-none bg-white border border-primary/10 rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none px-4 py-3 text-base font-bold text-primary focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all cursor-pointer"
                                    >
                                        <option value="public">Public - Everyone can access</option>
                                        <option value="restricted">Restricted - Specific roles only</option>
                                        <option value="private">Private - Admin only</option>
                                    </select>
                                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/30 pointer-events-none" />
                                </div>
                            </div>

                            {/* Status */}
                            <div className="space-y-2">
                                <Label htmlFor="status" className="text-sm font-bold text-primary/80 uppercase tracking-widest">Status</Label>
                                <div className="relative">
                                    <select
                                        id="status"
                                        value={status}
                                        onChange={(e) => setStatus(e.target.value as ContentStatus)}
                                        className="w-full appearance-none bg-white border border-primary/10 rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none px-4 py-3 text-base font-bold text-primary focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all cursor-pointer"
                                    >
                                        <option value="draft">Draft - Not visible to learners</option>
                                        <option value="published">Published - Available to learners</option>
                                        <option value="archived">Archived - Hidden from library</option>
                                    </select>
                                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/30 pointer-events-none" />
                                </div>
                            </div>

                            {/* Upload Progress */}
                            {uploading && (
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm font-bold text-primary/80">
                                        <span>Uploading...</span>
                                        <span>{Math.round(uploadProgress)}%</span>
                                    </div>
                                    <div className="w-full h-3 bg-primary/10 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-accent transition-all duration-300"
                                            style={{ width: `${uploadProgress}%` }}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Submit Buttons */}
                            <div className="flex gap-4 pt-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => router.back()}
                                    disabled={uploading}
                                    className="flex-1 h-12 rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none font-bold"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={!selectedFile || uploading}
                                    className="flex-1 h-12 bg-accent hover:bg-accent/90 text-white rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none font-bold"
                                >
                                    {uploading ? (
                                        <>
                                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                            Uploading...
                                        </>
                                    ) : (
                                        <>
                                            <Upload className="h-4 w-4 mr-2" />
                                            Upload Content
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
