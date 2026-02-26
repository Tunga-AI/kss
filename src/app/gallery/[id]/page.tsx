'use client';

import { useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Header } from "@/components/shared/header";
import { Footer } from "@/components/shared/footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useUsersFirestore, useDoc } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { MediaAlbum, MediaImage } from '@/lib/media-types';
import { ArrowLeft, Play, X, ZoomIn, Calendar } from 'lucide-react';
import Image from 'next/image';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

export default function AlbumDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = params?.id as string;
    const firestore = useUsersFirestore(); // gallery media lives in kenyasales DB

    const [selectedAsset, setSelectedAsset] = useState<MediaImage | null>(null);

    // Fetch Album Details
    const albumRef = useMemo(() => {
        if (!firestore || !id) return null;
        return doc(firestore, 'media', id);
    }, [firestore, id]);

    const { data: album, loading: loadingAlbum } = useDoc<MediaAlbum>(albumRef as any);

    const assets = useMemo(() => {
        if (!album?.images) return [];
        return [...album.images].sort((a, b) => (a.order || 0) - (b.order || 0));
    }, [album]);

    if (loadingAlbum && !album) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
        );
    }

    if (!album && !loadingAlbum) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
                <h1 className="text-2xl font-bold text-primary mb-4">Album not found</h1>
                <Button onClick={() => router.push('/gallery')}>Return to Gallery</Button>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-white">
            <Header />
            <main className="flex-grow">
                {/* Album Hero */}
                <div className="relative h-[60vh] min-h-[400px] w-full bg-black overflow-hidden">
                    {album?.featuredImage && (
                        <Image
                            src={album.featuredImage}
                            alt={album.title}
                            fill
                            className="object-cover opacity-60"
                            priority
                        />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

                    <div className="absolute top-8 left-4 sm:left-8 z-20">
                        <Button
                            variant="outline"
                            className="bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-sm"
                            onClick={() => router.push('/gallery')}
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Gallery
                        </Button>
                    </div>

                    <div className="absolute bottom-0 left-0 right-0 p-8 sm:p-12 z-20">
                        <div className="container mx-auto">
                            <div className="max-w-4xl animate-in slide-in-from-bottom-5 duration-700 fade-in">
                                <Badge className="bg-accent mb-4 px-3 py-1 text-sm font-bold uppercase tracking-wider text-white border-none">
                                    Album
                                </Badge>
                                <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold text-white mb-6 leading-tight">
                                    {album?.title}
                                </h1>
                                <div className="flex flex-wrap gap-6 items-center text-white/80 mb-8">
                                    <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest">
                                        <Calendar className="h-4 w-4 text-accent" />
                                        {album?.eventDate
                                            ? format((album.eventDate as any).toDate(), 'MMMM d, yyyy')
                                            : (album?.createdAt ? format((album.createdAt as any).toDate(), 'MMMM d, yyyy') : '')}
                                    </div>
                                    <div className="h-1 w-1 rounded-full bg-white/40" />
                                    <div className="text-lg text-white/90">
                                        {assets?.length || 0} Items
                                    </div>
                                </div>
                                <p className="text-lg sm:text-xl text-white/70 max-w-2xl leading-relaxed">
                                    {album?.description}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content Grid */}
                <section className="py-20 bg-gray-50">
                    <div className="container mx-auto px-4">
                        {assets && assets.length > 0 ? (
                            <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6">
                                {assets.map((asset) => (
                                    <Dialog key={asset.id}>
                                        <DialogTrigger asChild>
                                            <div className="break-inside-avoid relative group cursor-zoom-in rounded-xl overflow-hidden bg-white shadow-md hover:shadow-xl transition-all duration-300">
                                                {/* Check if URL is video by extension or logic if needed. Assuming images for now as MediaImage type implies images, but admin allows videos?
                                                    The admin page code supported 'video' type. The MediaImage type has just url.
                                                    If video is supported, we need a 'type' field in MediaImage or infer it.
                                                    The updated MediaImage type provided by USER does NOT have 'type'. It only has url.
                                                    The user request JSON shows images array field. 
                                                    I will proceed assuming images for now based on MediaImage type, or basic video support if URL ends in mp4/webm.
                                                */}
                                                <div className="relative">
                                                    <Image
                                                        src={asset.thumbnailUrl || asset.url}
                                                        alt={asset.caption || 'Gallery asset'}
                                                        width={800} // Approximate width for optimization
                                                        height={600}
                                                        className="w-full h-auto object-cover"
                                                    />
                                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                                        <ZoomIn className="text-white h-8 w-8 drop-shadow-md" />
                                                    </div>
                                                </div>

                                                {asset.caption && (
                                                    <div className="p-4 bg-white">
                                                        <p className="text-sm font-medium text-primary/80 leading-relaxed">{asset.caption}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </DialogTrigger>
                                        <DialogContent className="max-w-5xl h-[85vh] p-0 border-none bg-black/95 text-white flex flex-col items-center justify-center overflow-hidden focus:outline-none">
                                            <div className="relative w-full h-full">
                                                <Image
                                                    src={asset.url}
                                                    alt={asset.caption || 'Full view'}
                                                    fill
                                                    className="object-contain"
                                                />
                                            </div>
                                            {asset.caption && (
                                                <div className="absolute bottom-0 inset-x-0 p-6 bg-gradient-to-t from-black/90 to-transparent">
                                                    <p className="text-center text-lg font-medium text-white/90">{asset.caption}</p>
                                                </div>
                                            )}
                                        </DialogContent>
                                    </Dialog>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-20 text-primary/40">
                                <p>No items in this album yet.</p>
                            </div>
                        )}
                    </div>
                </section>
            </main>
            <Footer />
        </div>
    );
}

function VideoThumbnail({ asset }: { asset: MediaImage }) {
    return (
        <video
            src={asset.url}
            className="w-full h-full object-cover opacity-60"
            muted
            playsInline
            onMouseOver={e => e.currentTarget.play()}
            onMouseOut={e => {
                e.currentTarget.pause();
                e.currentTarget.currentTime = 0;
            }}
        />
    );
}
