'use client';

import { use, useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { doc, updateDoc, serverTimestamp, collection, query, orderBy } from 'firebase/firestore';
import { useUsersFirestore, useCollection, useDoc } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Save, Loader2, X, Plus } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import type { ContentItem, ContentFolder } from '@/lib/content-library-types';

export default function EditContentPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const firestore = useUsersFirestore();

    const contentRef = useMemo(() => {
        if (!firestore) return null;
        return doc(firestore, 'contentLibrary', id);
    }, [firestore, id]);

    const { data: content, loading } = useDoc<ContentItem>(contentRef as any);

    const foldersQuery = useMemo(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'contentFolders'), orderBy('name', 'asc'));
    }, [firestore]);
    const { data: folders } = useCollection<ContentFolder>(foldersQuery as any);

    // Form state
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [status, setStatus] = useState<'draft' | 'published' | 'archived'>('draft');
    const [visibility, setVisibility] = useState<'public' | 'restricted' | 'private'>('private');
    const [folderId, setFolderId] = useState('');
    const [tags, setTags] = useState<string[]>([]);
    const [tagInput, setTagInput] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    // Populate form when content loads
    useEffect(() => {
        if (content) {
            setTitle(content.title || '');
            setDescription(content.description || '');
            setStatus(content.status || 'draft');
            setVisibility(content.visibility || 'private');
            setFolderId(content.folderId || '');
            setTags(content.tags || []);
        }
    }, [content]);

    const addTag = () => {
        const trimmed = tagInput.trim();
        if (trimmed && !tags.includes(trimmed)) {
            setTags([...tags, trimmed]);
        }
        setTagInput('');
    };

    const removeTag = (tag: string) => {
        setTags(tags.filter(t => t !== tag));
    };

    const handleSave = async () => {
        if (!firestore || !contentRef) return;
        if (!title.trim()) {
            toast({ title: 'Validation Error', description: 'Title is required.', variant: 'destructive' });
            return;
        }

        setIsSaving(true);
        try {
            await updateDoc(contentRef, {
                title: title.trim(),
                description: description.trim(),
                status,
                visibility,
                folderId: folderId || null,
                tags,
                updatedAt: serverTimestamp(),
            });
            toast({ title: 'Saved', description: 'Content updated successfully.' });
            router.push(`/a/library/${id}`);
        } catch (error) {
            console.error('Error saving content:', error);
            toast({ title: 'Error', description: 'Failed to save changes.', variant: 'destructive' });
        } finally {
            setIsSaving(false);
        }
    };

    if (!firestore || loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!content) {
        return (
            <div className="p-8 text-center">
                <h1 className="text-xl font-bold mb-4">Content Not Found</h1>
                <Button onClick={() => router.back()}>Go Back</Button>
            </div>
        );
    }

    return (
        <div className="w-full min-h-screen bg-gray-50/50 p-4 md:p-8 font-body">
            <div className="max-w-3xl mx-auto space-y-6">

                {/* Header */}
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => router.back()}
                            className="h-10 w-10 border-primary/20 text-primary hover:bg-primary/5"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold text-primary">Edit Content</h1>
                            <p className="text-sm text-primary/60">{content.fileName}</p>
                        </div>
                    </div>
                    <Button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="bg-primary text-white hover:bg-primary/90 rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none h-11 px-6 font-bold"
                    >
                        {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                        Save Changes
                    </Button>
                </div>

                {/* Main Fields */}
                <Card className="border border-primary/10 shadow-lg rounded-tl-2xl rounded-br-2xl rounded-tr-none rounded-bl-none">
                    <CardHeader className="bg-primary/5 border-b border-primary/10">
                        <CardTitle className="text-base font-bold text-primary">Content Details</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-5">
                        <div className="space-y-2">
                            <Label htmlFor="title" className="text-xs font-bold text-primary/60 uppercase tracking-widest">Title *</Label>
                            <Input
                                id="title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Content title..."
                                className="h-12 border-primary/10 rounded-tl-lg rounded-br-lg rounded-tr-none rounded-bl-none focus:ring-primary"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description" className="text-xs font-bold text-primary/60 uppercase tracking-widest">Description</Label>
                            <Textarea
                                id="description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Brief description of this content..."
                                rows={4}
                                className="border-primary/10 rounded-tl-lg rounded-br-lg rounded-tr-none rounded-bl-none focus:ring-primary resize-none"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Settings */}
                <Card className="border border-primary/10 shadow-lg rounded-tl-2xl rounded-br-2xl rounded-tr-none rounded-bl-none">
                    <CardHeader className="bg-primary/5 border-b border-primary/10">
                        <CardTitle className="text-base font-bold text-primary">Settings</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-primary/60 uppercase tracking-widest">Status</Label>
                                <select
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value as typeof status)}
                                    className="w-full h-12 appearance-none bg-white border border-primary/10 rounded-tl-lg rounded-br-lg rounded-tr-none rounded-bl-none px-4 text-sm font-bold text-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
                                >
                                    <option value="draft">Draft</option>
                                    <option value="published">Published</option>
                                    <option value="archived">Archived</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-primary/60 uppercase tracking-widest">Visibility</Label>
                                <select
                                    value={visibility}
                                    onChange={(e) => setVisibility(e.target.value as typeof visibility)}
                                    className="w-full h-12 appearance-none bg-white border border-primary/10 rounded-tl-lg rounded-br-lg rounded-tr-none rounded-bl-none px-4 text-sm font-bold text-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
                                >
                                    <option value="public">Public</option>
                                    <option value="restricted">Restricted</option>
                                    <option value="private">Private</option>
                                </select>
                            </div>
                        </div>

                        {folders && folders.length > 0 && (
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-primary/60 uppercase tracking-widest">Folder</Label>
                                <select
                                    value={folderId}
                                    onChange={(e) => setFolderId(e.target.value)}
                                    className="w-full h-12 appearance-none bg-white border border-primary/10 rounded-tl-lg rounded-br-lg rounded-tr-none rounded-bl-none px-4 text-sm font-bold text-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
                                >
                                    <option value="">No Folder</option>
                                    {folders.map(f => (
                                        <option key={f.id} value={f.id}>{f.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Tags */}
                <Card className="border border-primary/10 shadow-lg rounded-tl-2xl rounded-br-2xl rounded-tr-none rounded-bl-none">
                    <CardHeader className="bg-primary/5 border-b border-primary/10">
                        <CardTitle className="text-base font-bold text-primary">Tags</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                        <div className="flex gap-2">
                            <Input
                                value={tagInput}
                                onChange={(e) => setTagInput(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                                placeholder="Add a tag and press Enter..."
                                className="h-10 border-primary/10 rounded-tl-lg rounded-br-lg rounded-tr-none rounded-bl-none focus:ring-primary"
                            />
                            <Button
                                type="button"
                                variant="outline"
                                onClick={addTag}
                                className="h-10 px-4 border-primary/10 rounded-tl-lg rounded-br-lg rounded-tr-none rounded-bl-none"
                            >
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>
                        {tags.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {tags.map(tag => (
                                    <Badge key={tag} variant="secondary" className="gap-1 pr-1 rounded-tl-sm rounded-br-sm rounded-tr-none rounded-bl-none font-bold">
                                        {tag}
                                        <button
                                            onClick={() => removeTag(tag)}
                                            className="ml-1 hover:text-red-500 transition-colors"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </Badge>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Read-only File Info */}
                <Card className="border border-primary/10 shadow-lg rounded-tl-2xl rounded-br-2xl rounded-tr-none rounded-bl-none">
                    <CardHeader className="bg-primary/5 border-b border-primary/10">
                        <CardTitle className="text-base font-bold text-primary">File Info (read-only)</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="text-xs font-bold text-primary/40 uppercase tracking-widest mb-1">File Name</p>
                                <p className="font-medium text-primary">{content.fileName}</p>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-primary/40 uppercase tracking-widest mb-1">Type</p>
                                <p className="font-medium text-primary capitalize">{content.type}</p>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-primary/40 uppercase tracking-widest mb-1">MIME Type</p>
                                <p className="font-medium text-primary font-mono text-xs">{content.mimeType}</p>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-primary/40 uppercase tracking-widest mb-1">Version</p>
                                <p className="font-medium text-primary">v{content.version || 1}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Bottom Save */}
                <div className="flex justify-end pb-8">
                    <Button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="bg-primary text-white hover:bg-primary/90 rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none h-12 px-8 font-bold"
                    >
                        {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                        Save Changes
                    </Button>
                </div>
            </div>
        </div>
    );
}
