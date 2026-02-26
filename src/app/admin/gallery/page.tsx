'use client';

import { useState, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useStorage, useUsersFirestore, useDoc, useCollection } from '@/firebase';
import { collection, query, orderBy, doc, Timestamp } from 'firebase/firestore';
import type { MediaAlbum, MediaImage } from '@/lib/media-types';
import { createMediaAlbum, deleteMediaAlbum, addMediaImage, deleteMediaImage, updateMediaAlbum } from '@/lib/gallery';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import Image from 'next/image';
import { Trash2, RefreshCw, ArrowLeft, Image as ImageIcon, Save, Plus, Search, ChevronDown, Edit, LayoutGrid, Upload, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

export default function AdminGalleryPage() {
    const firestore = useUsersFirestore(); // gallery media lives in kenyasales DB
    const storage = useStorage();

    const [view, setView] = useState<'list' | 'create' | 'edit'>('list');
    const [selectedAlbumId, setSelectedAlbumId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    // Queries
    const albumsQuery = useMemo(() => {
        if (!firestore) return null;
        return query(collection(firestore, "media"), orderBy('createdAt', 'desc'));
    }, [firestore]);

    const { data: albums, loading: loadingAlbums } = useCollection<MediaAlbum>(albumsQuery as any);

    const filteredAlbums = useMemo(() => {
        if (!albums) return [];
        return albums.filter(album => {
            const matchesSearch = album.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (album.description || '').toLowerCase().includes(searchQuery.toLowerCase());
            const matchesStatus = statusFilter === 'all' || album.status === statusFilter.toLowerCase();
            return matchesSearch && matchesStatus;
        });
    }, [albums, searchQuery, statusFilter]);

    const handleCreateAlbum = () => {
        setSelectedAlbumId(null);
        setView('create');
    };

    const handleEditAlbum = (albumId: string) => {
        setSelectedAlbumId(albumId);
        setView('edit');
    };

    const handleDeleteAlbum = async (albumId: string, featuredImage?: string, images?: MediaImage[]) => {
        if (!firestore || !storage) return;
        if (confirm("Are you sure? This will delete the album and all its images permanently.")) {
            await deleteMediaAlbum(firestore, storage, albumId, featuredImage, images);
        }
    };

    const handleBackToList = () => {
        setView('list');
        setSelectedAlbumId(null);
    };

    if (loadingAlbums && !albums) {
        return (
            <div className="p-8 flex items-center justify-center min-h-screen">
                <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="w-full min-h-screen bg-gray-50/50 p-2 md:p-4 font-body">
            {view === 'list' && (
                <div className="w-full">
                    {/* Hero Section */}
                    <div className="bg-primary text-white p-6 mb-6 border-b border-primary/10 rounded-tl-3xl rounded-br-3xl rounded-tr-none rounded-bl-none shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-accent/20 rounded-full blur-3xl opacity-20" />

                        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <LayoutGrid className="h-8 w-8 bg-accent/20 p-1.5 rounded-lg text-accent" />
                                    <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Gallery Management</h1>
                                </div>
                                <p className="text-white/80 text-lg font-medium">Manage your photo and video collections</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <Button onClick={handleCreateAlbum} className="bg-secondary hover:bg-secondary/90 text-white border-none h-12 px-6 rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none font-bold shadow-lg transition-all">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Create New Album
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Filters Row */}
                    <div className="flex flex-col lg:flex-row gap-4 mb-6 items-end">
                        <div className="relative flex-1 group w-full">
                            <label className="text-xs font-bold text-primary/40 uppercase tracking-widest ml-1 mb-2 block">Search Albums</label>
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary/30 group-focus-within:text-primary transition-colors" />
                                <Input
                                    placeholder="Search by title or description..."
                                    className="pl-12 h-14 bg-white border-primary/10 rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none focus:ring-primary focus:border-primary shadow-sm text-base font-medium"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-4 items-end w-full lg:w-auto">
                            <DropdownCard
                                label="Filter By Status"
                                value={statusFilter}
                                onChange={(val: string) => setStatusFilter(val)}
                                options={[
                                    { value: 'all', label: 'All Albums' },
                                    { value: 'published', label: 'Published' },
                                    { value: 'draft', label: 'Draft' },
                                    { value: 'archived', label: 'Archived' }
                                ]}
                                className="w-full sm:w-64"
                            />
                        </div>
                    </div>

                    {/* Albums Table */}
                    <div className="w-full bg-white shadow-lg border border-primary/10 overflow-hidden rounded-tl-2xl rounded-br-2xl rounded-tr-none rounded-bl-none">
                        <div className="overflow-x-auto">
                            <Table className="w-full">
                                <TableHeader className="bg-primary/5 border-b border-primary/10">
                                    <TableRow className="hover:bg-transparent">
                                        <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest w-24">Featured</TableHead>
                                        <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest">Album Details</TableHead>
                                        <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest text-center">Status</TableHead>
                                        <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest text-center">Items</TableHead>
                                        <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest text-center">Date</TableHead>
                                        <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody className="divide-y divide-primary/10">
                                    {filteredAlbums.map((album) => (
                                        <TableRow key={album.id} className="hover:bg-primary/5 cursor-pointer transition-colors group border-primary/10" onClick={() => handleEditAlbum(album.id)}>
                                            <TableCell className="px-6 py-4">
                                                <div className="h-12 w-16 relative bg-primary/10 rounded-md overflow-hidden border border-primary/10">
                                                    {album.featuredImage ? (
                                                        <Image src={album.featuredImage} alt={album.title} fill className="object-cover" />
                                                    ) : (
                                                        <div className="flex items-center justify-center h-full text-primary/20">
                                                            <ImageIcon className="h-6 w-6" />
                                                        </div>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="px-6 py-4">
                                                <div>
                                                    <p className="font-bold text-primary leading-tight">{album.title}</p>
                                                    <p className="text-[10px] text-primary/60 mt-0.5 uppercase tracking-tighter line-clamp-1 max-w-[300px]">{album.description || 'No description'}</p>
                                                    {album.location && (
                                                        <p className="text-[10px] text-primary/40 mt-1 flex items-center gap-1">📍 {album.location}</p>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="px-6 py-4 text-center">
                                                <Badge className={cn(
                                                    "rounded-tl-sm rounded-br-sm rounded-tr-none rounded-bl-none font-bold text-[9px] uppercase tracking-widest border-none px-3",
                                                    album.status === 'published' ? 'bg-green-500 text-white' : 'bg-primary/20 text-primary/60'
                                                )}>
                                                    {album.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="px-6 py-4 text-center">
                                                <span className="text-xs font-bold text-primary/60">{album.images?.length || 0}</span>
                                            </TableCell>
                                            <TableCell className="px-6 py-4 text-center">
                                                <div className="text-[10px] font-bold text-primary/60">
                                                    {album.eventDate
                                                        ? format((album.eventDate as any).toDate(), 'MMM d, yyyy')
                                                        : (album.createdAt ? format((album.createdAt as any).toDate(), 'MMM d, yyyy') : '-')}
                                                </div>
                                            </TableCell>
                                            <TableCell className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-2 transition-opacity">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 shadow-none hover:bg-primary/5 rounded-tl-md rounded-br-md rounded-tr-none rounded-bl-none"
                                                        onClick={(e) => { e.stopPropagation(); handleEditAlbum(album.id); }}
                                                    >
                                                        <Edit className="h-4 w-4 text-primary" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 shadow-none hover:bg-red-50 hover:text-red-500 rounded-tl-md rounded-br-md rounded-tr-none rounded-bl-none"
                                                        onClick={(e) => { e.stopPropagation(); handleDeleteAlbum(album.id, album.featuredImage, album.images); }}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {filteredAlbums.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-20">
                                                <div className="flex flex-col items-center gap-2">
                                                    <LayoutGrid className="h-12 w-12 text-primary/10" />
                                                    <p className="text-primary/40 font-bold uppercase tracking-widest text-xs">No albums found</p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </div>
            )}

            {(view === 'create' || (view === 'edit' && selectedAlbumId)) && (
                <AlbumEditor
                    albumId={selectedAlbumId}
                    onBack={handleBackToList}
                    firestore={firestore}
                    storage={storage}
                />
            )}
        </div>
    );
}

function AlbumEditor({ albumId, onBack, firestore, storage }: { albumId: string | null, onBack: () => void, firestore: any, storage: any }) {
    // Fetch live data for the album being edited
    const albumRef = useMemo(() => {
        return albumId && firestore ? doc(firestore, 'media', albumId) : null;
    }, [firestore, albumId]);

    const { data: albumData, loading } = useDoc<MediaAlbum>(albumRef as any);

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [status, setStatus] = useState<'published' | 'draft' | 'archived'>('draft');
    const [location, setLocation] = useState('');
    const [eventDate, setEventDate] = useState<string>('');
    const [featuredImageFile, setFeaturedImageFile] = useState<File | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // Effect to load initial data when albumData is fetched
    useMemo(() => {
        if (albumData) {
            setTitle(albumData.title);
            setDescription(albumData.description || '');
            setStatus((albumData.status as any) || 'draft');
            setLocation(albumData.location || '');
            if (albumData.eventDate) {
                try {
                    const date = (albumData.eventDate as any).toDate();
                    // Adjust to local ISO string for datetime-local input
                    const offset = date.getTimezoneOffset() * 60000;
                    const localISOTime = (new Date(date.getTime() - offset)).toISOString().slice(0, 16);
                    setEventDate(localISOTime);
                } catch (e) { }
            }
        }
    }, [albumData]);

    // Local state for tracking current ID if we created a new one
    const [currentAlbumId, setCurrentAlbumId] = useState<string | null>(albumId);

    // Asset Upload State
    const [assetFiles, setAssetFiles] = useState<FileList | null>(null);
    const [isUploadingAssets, setIsUploadingAssets] = useState(false);

    const handleSaveAlbum = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!firestore || !storage) return;
        setIsSaving(true);

        try {
            let featuredImage = albumData?.featuredImage || '';

            if (featuredImageFile) {
                const storageRef = ref(storage, `media/albums/thumbnails/${Date.now()}_${featuredImageFile.name}`);
                await uploadBytes(storageRef, featuredImageFile);
                featuredImage = await getDownloadURL(storageRef);
            }

            const albumPayload: Partial<MediaAlbum> = {
                title,
                description,
                status,
                location,
                featuredImage,
                authorId: "G5mCzx0zFjXqznsMkjLieQrpVUG3",
                authorName: "Stephen Gathiru",
            };

            if (eventDate) {
                albumPayload.eventDate = Timestamp.fromDate(new Date(eventDate));
            }

            if (currentAlbumId) {
                await updateMediaAlbum(firestore, currentAlbumId, albumPayload);
            } else {
                const newId = await createMediaAlbum(firestore, albumPayload);
                setCurrentAlbumId(newId);
            }
        } catch (error) {
            console.error(error);
            alert("Failed to save album");
        } finally {
            setIsSaving(false);
        }
    };

    const handleUploadAssets = async () => {
        if (!assetFiles || !firestore || !storage || !currentAlbumId) return;
        setIsUploadingAssets(true);

        try {
            for (let i = 0; i < assetFiles.length; i++) {
                const file = assetFiles[i];
                const storageRef = ref(storage, `media/albums/${currentAlbumId}/${Date.now()}_${file.name}`);
                await uploadBytes(storageRef, file);
                const url = await getDownloadURL(storageRef);

                const newImage: MediaImage = {
                    id: `temp_${Date.now()}_${i}`,
                    url,
                    thumbnailUrl: url,
                    caption: '',
                    order: (albumData?.images?.length || 0) + i
                };

                await addMediaImage(firestore, currentAlbumId, newImage);
            }
            setAssetFiles(null);
            const fileInput = document.getElementById('asset-upload') as HTMLInputElement;
            if (fileInput) fileInput.value = '';

        } catch (error) {
            console.error("Asset upload failed", error);
            alert("Some assets failed to upload");
        } finally {
            setIsUploadingAssets(false);
        }
    };

    const handleDeleteAsset = (image: MediaImage) => {
        if (!firestore || !storage || !currentAlbumId) return;
        if (confirm("Delete this image?")) {
            deleteMediaImage(firestore, storage, currentAlbumId, image);
        }
    }

    const handleDeleteThisAlbum = async () => {
        if (!firestore || !storage || !currentAlbumId) return;
        if (confirm("Are you sure? This will delete the album and all images.")) {
            await deleteMediaAlbum(firestore, storage, currentAlbumId, albumData?.featuredImage, albumData?.images);
            onBack();
        }
    }

    if (loading && albumId) {
        return <div className="p-8 text-center text-primary/40">Loading album...</div>;
    }

    const images = (albumData?.images || []).slice().sort((a, b) => (a.order || 0) - (b.order || 0));

    return (
        <div className="space-y-8 max-w-7xl mx-auto">
            <Button variant="ghost" onClick={onBack} className="pl-0 hover:bg-transparent text-primary/60 hover:text-primary mb-4">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Albums
            </Button>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left: Album Metadata */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="bg-white p-6 rounded-tl-3xl rounded-br-3xl rounded-tr-none rounded-bl-none shadow-xl border border-primary/10 sticky top-4">
                        <h2 className="font-bold text-xl mb-6 text-primary flex items-center gap-2">
                            <Edit className="h-5 w-5 text-accent" /> Album Details
                        </h2>
                        <form onSubmit={handleSaveAlbum} className="space-y-5">
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-primary/40 uppercase tracking-widest">Title</Label>
                                <Input value={title} onChange={e => setTitle(e.target.value)} required placeholder="e.g. Graduation 2025" className="h-12 border-primary/10 focus:border-primary rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-primary/40 uppercase tracking-widest">Description</Label>
                                <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="What is this album about?" className="min-h-[100px] border-primary/10 focus:border-primary rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-primary/40 uppercase tracking-widest">Location</Label>
                                <Input value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Nairobi, Kenya" className="h-12 border-primary/10 focus:border-primary rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-primary/40 uppercase tracking-widest">Event Date</Label>
                                <Input type="datetime-local" value={eventDate} onChange={e => setEventDate(e.target.value)} className="h-12 border-primary/10 focus:border-primary rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-primary/40 uppercase tracking-widest">Status</Label>
                                <div className="flex items-center gap-3 p-3 border border-primary/10 rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none bg-gray-50/50">
                                    <Switch checked={status === 'published'} onCheckedChange={c => setStatus(c ? 'published' : 'draft')} />
                                    <Badge className={cn(
                                        "rounded-tl-sm rounded-br-sm rounded-tr-none rounded-bl-none font-bold text-[9px] uppercase tracking-widest border-none px-3",
                                        status === 'published' ? 'bg-green-500 text-white' : 'bg-primary/20 text-primary/60'
                                    )}>
                                        {status}
                                    </Badge>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-primary/40 uppercase tracking-widest">Featured Image</Label>
                                <div className="relative aspect-video bg-gray-100 rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none overflow-hidden border-2 border-dashed border-primary/10 group hover:border-accent/40 transition-colors">
                                    {featuredImageFile ? (
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white text-xs z-10">
                                            {featuredImageFile.name}
                                        </div>
                                    ) : null}

                                    {(albumData?.featuredImage || featuredImageFile) && (
                                        <Image
                                            src={featuredImageFile ? URL.createObjectURL(featuredImageFile) : albumData!.featuredImage}
                                            alt="Cover"
                                            fill
                                            className="object-cover transition-transform group-hover:scale-105"
                                        />
                                    )}

                                    <Input type="file" className="opacity-0 absolute inset-0 cursor-pointer z-20" onChange={e => e.target.files && setFeaturedImageFile(e.target.files[0])} accept="image/*" />

                                    {!albumData?.featuredImage && !featuredImageFile && (
                                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-primary/40">
                                            <Upload className="h-8 w-8 mb-2" />
                                            <span className="text-xs font-bold uppercase tracking-widest">Click to upload</span>
                                        </div>
                                    )}
                                </div>
                                {featuredImageFile && <p className="text-xs text-green-600 font-bold flex items-center gap-1"><CheckCircle className="h-3 w-3" /> New file selected</p>}
                            </div>

                            <div className="pt-4 flex gap-2">
                                <Button type="submit" disabled={isSaving} className="w-full bg-secondary hover:bg-secondary/90 text-white h-12 rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none font-bold shadow-lg">
                                    {isSaving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                                    {currentAlbumId ? 'Update Details' : 'Create Album'}
                                </Button>
                            </div>
                        </form>
                        {currentAlbumId && (
                            <div className="mt-8 border-t border-primary/10 pt-6">
                                <Button variant="ghost" size="sm" onClick={handleDeleteThisAlbum} className="w-full text-red-500 hover:text-red-600 hover:bg-red-50">
                                    <Trash2 className="h-4 w-4 mr-2" /> Delete Album Permanently
                                </Button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right: Assets */}
                <div className="lg:col-span-8 space-y-6">
                    {currentAlbumId ? (
                        <div className="bg-white p-8 rounded-tl-3xl rounded-br-3xl rounded-tr-none rounded-bl-none shadow-xl border border-primary/10 min-h-[500px]">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                                <div>
                                    <h2 className="font-bold text-xl text-primary flex items-center gap-2">
                                        <ImageIcon className="h-5 w-5 text-accent" /> Album Media Assets
                                    </h2>
                                    <p className="text-sm text-primary/60 mt-1">Manage photos and videos for this album</p>
                                </div>
                                <div className="flex gap-2">
                                    <Input
                                        id="asset-upload"
                                        type="file"
                                        multiple
                                        className="hidden"
                                        onChange={e => setAssetFiles(e.target.files)}
                                        accept="image/*,video/*"
                                    />
                                    <Button onClick={() => document.getElementById('asset-upload')?.click()} variant="outline" className="h-10 border-primary/20 hover:bg-primary/5">
                                        <Plus className="h-4 w-4 mr-2" /> Add Files
                                    </Button>
                                    {assetFiles && assetFiles.length > 0 && (
                                        <Button onClick={handleUploadAssets} disabled={isUploadingAssets} className="bg-secondary text-white h-10">
                                            {isUploadingAssets ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
                                            Upload {assetFiles.length} item(s)
                                        </Button>
                                    )}
                                </div>
                            </div>

                            {assetFiles && assetFiles.length > 0 && (
                                <div className="mb-6 p-4 bg-accent/5 border border-accent/10 text-accent text-sm rounded-lg flex items-center justify-between">
                                    <span className="font-bold">{assetFiles.length} file(s) ready to upload.</span>
                                    <Button size="sm" variant="ghost" onClick={() => setAssetFiles(null)} className="h-auto p-0 text-accent hover:text-accent/80">Cancel</Button>
                                </div>
                            )}

                            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {images.map(img => (
                                    <div key={img.id} className="group relative aspect-square bg-gray-100 rounded-lg overflow-hidden border border-gray-200 shadow-sm hover:shadow-md transition-all">
                                        <Image src={img.thumbnailUrl || img.url} alt="asset" fill className="object-cover" />
                                        <div className="absolute inset-0 bg-primary/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-4">
                                            <div className="flex gap-2">
                                                <Button size="icon" variant="destructive" className="h-8 w-8 rounded-full" onClick={() => handleDeleteAsset(img)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                                <Button size="icon" variant="secondary" className="h-8 w-8 rounded-full" onClick={() => window.open(img.url, '_blank')}>
                                                    <LayoutGrid className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {(!images || images.length === 0) && (
                                <div className="flex flex-col items-center justify-center h-64 text-primary/30 border-2 border-dashed border-primary/5 rounded-2xl bg-gray-50/50">
                                    <div className="h-16 w-16 bg-primary/5 rounded-full flex items-center justify-center mb-4">
                                        <ImageIcon className="h-8 w-8 text-primary/20" />
                                    </div>
                                    <p className="font-bold text-lg">No assets yet</p>
                                    <p className="text-sm">Upload photos or videos to get started</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full bg-white rounded-tl-3xl rounded-br-3xl rounded-tr-none rounded-bl-none shadow-xl border border-primary/10 p-12 text-primary/40 min-h-[500px]">
                            <LayoutGrid className="h-20 w-20 mb-6 text-primary/10" />
                            <h3 className="text-2xl font-bold text-primary mb-2">Create Album First</h3>
                            <p className="text-lg text-primary/60 max-w-md text-center">Please save the album details on the left to start uploading assets.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function DropdownCard({ label, value, onChange, options, className }: any) {
    return (
        <div className={`flex flex-col gap-2 ${className}`}>
            <label className="text-xs font-bold text-primary/40 uppercase tracking-widest ml-1">{label}</label>
            <div className="relative group">
                <select
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-full appearance-none bg-white border border-primary/10 rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none px-4 py-2 text-sm md:text-base font-bold text-primary focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all cursor-pointer shadow-sm h-14"
                >
                    {options.map((opt: any) => (
                        <option key={opt.value} value={opt.value} className="font-medium">{opt.label}</option>
                    ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                    <ChevronDown className="h-4 w-4 text-primary/30 group-hover:text-primary transition-colors" />
                </div>
            </div>
        </div>
    );
}
