'use client';

import { useMemo, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useFirestore, useStorage } from '@/firebase';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection, query, orderBy } from 'firebase/firestore';
import type { GalleryImage } from '@/lib/gallery-types';
import { addGalleryImage, deleteGalleryImage } from '@/lib/gallery';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import Image from 'next/image';
import { Trash2, UploadCloud } from 'lucide-react';

export default function AdminGalleryPage() {
    const firestore = useFirestore();
    const storage = useStorage();

    const [imageFile, setImageFile] = useState<File | null>(null);
    const [album, setAlbum] = useState('');
    const [description, setDescription] = useState('');
    const [isUploading, setIsUploading] = useState(false);

    const galleryQuery = useMemo(() => {
        if (!firestore) return null;
        return query(collection(firestore, "gallery"), orderBy('createdAt', 'desc'));
    }, [firestore]);

    const { data: images, loading } = useCollection<GalleryImage>(galleryQuery);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setImageFile(e.target.files[0]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!firestore || !storage || !imageFile || !album) {
            alert('Please select an image and enter an album name.');
            return;
        }

        setIsUploading(true);
        try {
            const storageRef = ref(storage, `media/albums/${Date.now()}_${imageFile.name}`);
            await uploadBytes(storageRef, imageFile);
            const downloadURL = await getDownloadURL(storageRef);

            const imageData: Omit<GalleryImage, 'id' | 'createdAt'> = {
                album,
                description,
                imageUrl: downloadURL,
            };
            addGalleryImage(firestore, imageData);
            
            // Reset form
            setImageFile(null);
            setAlbum('');
            setDescription('');
            (e.target as HTMLFormElement).reset();

        } catch (error) {
            console.error("Error uploading image:", error);
            alert("Failed to upload image.");
        } finally {
            setIsUploading(false);
        }
    };

    const handleDelete = (image: GalleryImage) => {
        if (firestore && storage && confirm('Are you sure you want to delete this image?')) {
            deleteGalleryImage(firestore, storage, image);
        }
    };
    
    return (
        <div className="grid gap-6 p-4 sm:p-6 lg:p-10">
            <Card className="bg-primary text-primary-foreground">
                <CardHeader>
                    <CardTitle className="font-headline text-xl sm:text-2xl">Manage Gallery</CardTitle>
                    <CardDescription className="text-primary-foreground/80">Upload, view, and organize your gallery images.</CardDescription>
                </CardHeader>
            </Card>

             <Card>
                <CardHeader>
                    <CardTitle>Upload New Image</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="grid gap-6">
                        <div className="grid sm:grid-cols-2 gap-6">
                            <div className="grid gap-3">
                                <Label htmlFor="album">Album Name</Label>
                                <Input id="album" type="text" value={album} onChange={(e) => setAlbum(e.target.value)} placeholder="e.g., Workshops 2024" required/>
                            </div>
                            <div className="grid gap-3">
                                <Label htmlFor="image">Image File</Label>
                                <Input id="image" type="file" onChange={handleImageChange} accept="image/*" required/>
                            </div>
                        </div>
                         <div className="grid gap-3">
                            <Label htmlFor="description">Description (Optional)</Label>
                            <Input id="description" type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="A brief description of the image." />
                        </div>
                        <div className="flex gap-4">
                            <Button type="submit" disabled={isUploading}>
                                {isUploading ? 'Uploading...' : <> <UploadCloud className="mr-2"/> Upload Image </>}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Uploaded Images</CardTitle>
                </CardHeader>
                <CardContent>
                     {loading && <p>Loading images...</p>}
                     {!loading && (!images || images.length === 0) && <p>No images have been uploaded yet.</p>}
                     <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {images?.map((image) => (
                           <div key={image.id} className="relative group">
                                <Image
                                    src={image.imageUrl}
                                    alt={image.description || 'Gallery image'}
                                    width={300}
                                    height={300}
                                    className="object-cover w-full h-48 rounded-lg"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2 text-white text-xs">
                                   <div>
                                        <p className="font-bold">{image.album}</p>
                                        <p className="truncate">{image.description}</p>
                                   </div>
                                    <Button
                                        variant="destructive"
                                        size="icon"
                                        className="h-8 w-8 self-end"
                                        onClick={() => handleDelete(image)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                        <span className="sr-only">Delete</span>
                                    </Button>
                                </div>
                           </div>
                        ))}
                     </div>
                </CardContent>
            </Card>
        </div>
    )
}
