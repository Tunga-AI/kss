'use client';
import type { Program } from '@/lib/program-types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRouter } from 'next/navigation';
import { useFirestore, useStorage } from '@/firebase';
import { addProgram, updateProgram } from '@/lib/programs';
import React, { useState } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export function ProgramForm({ program }: { program: Partial<Program> }) {
    const isNew = !program.id;
    const [formData, setFormData] = useState<Partial<Program>>({
        title: '',
        slug: '',
        description: '',
        imageUrl: '',
        duration: '',
        level: 'Beginner',
        takeaways: [],
        price: '',
        date: '',
        time: '',
        location: '',
        speakers: [],
        ...program,
    });
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const router = useRouter();
    const firestore = useFirestore();
    const storage = useStorage();

    const programType = formData.programType;
    const isCourse = programType === 'Core' || programType === 'E-Learning' || programType === 'Short';
    const isEvent = programType === 'Event';

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { id, value } = e.target;
         let finalValue = value;
        if (id === 'slug') {
            finalValue = value.toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '');
        }
        setFormData(prev => ({ ...prev, [id]: finalValue }));
    };

    const handleSelectChange = (id: string, value: string) => {
        setFormData(prev => ({ ...prev, [id]: value as any }));
    };

    const handleTakeawaysChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setFormData(prev => ({ ...prev, takeaways: e.target.value.split('\n') }));
    }

    const handleSpeakersChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const speakerData = e.target.value.split('\n').map(line => {
            const [name, title] = line.split(',').map(s => s.trim());
            return { name: name || '', title: title || '', avatar: `https://picsum.photos/seed/${name?.toLowerCase().replace(' ', '')}/40/40` };
        }).filter(s => s.name);
        setFormData(prev => ({ ...prev, speakers: speakerData }));
    }

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setImageFile(e.target.files[0]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!firestore || !storage) return;

        setIsUploading(true);

        let dataToSave = { ...formData };

        if (imageFile) {
            const storageRef = ref(storage, `programs/${Date.now()}_${imageFile.name}`);
            await uploadBytes(storageRef, imageFile);
            const downloadURL = await getDownloadURL(storageRef);
            dataToSave.imageUrl = downloadURL;
        }

        // Clean up data before saving
        if (dataToSave.id === '') {
            delete dataToSave.id;
        }

        if (dataToSave.takeaways) {
            dataToSave.takeaways = dataToSave.takeaways.filter(t => t.trim() !== '');
        }

        if (isNew) {
            addProgram(firestore, dataToSave as Omit<Program, 'id' | 'createdAt' | 'updatedAt'>);
        } else if (dataToSave.id) {
            const { id, ...rest } = dataToSave;
            updateProgram(firestore, id, rest);
        }
        
        setIsUploading(false);
        router.push('/a/programs');
    };

    return (
        <div className="grid gap-6 p-4 sm:p-6 lg:p-10">
            <Card className="bg-primary text-primary-foreground">
                 <CardHeader>
                    <CardTitle className="font-headline text-xl sm:text-2xl">{isNew ? 'Create' : 'Edit'} {program.programType}</CardTitle>
                    <CardDescription className="text-primary-foreground/80">{isNew ? `Enter the details for the new ${program.programType}.` : `Make changes to the "${program.title}" details below.`}</CardDescription>
                </CardHeader>
            </Card>
            <Card>
                <CardContent className="pt-6">
                    <form className="grid gap-6" onSubmit={handleSubmit}>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="grid gap-3">
                                <Label htmlFor="title">Title</Label>
                                <Input id="title" type="text" value={formData.title} onChange={handleChange} required />
                            </div>
                            <div className="grid gap-3">
                                <Label htmlFor="slug">URL Slug</Label>
                                <Input id="slug" type="text" value={formData.slug} onChange={handleChange} required />
                            </div>
                        </div>
                        <div className="grid gap-3">
                            <Label htmlFor="description">Description</Label>
                            <Textarea id="description" value={formData.description} onChange={handleChange} rows={5} />
                        </div>

                        <div className="grid gap-3">
                            <Label htmlFor="image">Program Image</Label>
                            <Input id="image" type="file" onChange={handleImageChange} accept="image/*" />
                            {formData.imageUrl && !imageFile && (
                                <div className="mt-2">
                                    <p className="text-sm text-muted-foreground">Current image:</p>
                                    <img src={formData.imageUrl} alt="Current program image" className="w-32 h-32 object-cover rounded-md mt-1" />
                                </div>
                            )}
                        </div>

                        {isCourse && (
                            <>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div className="grid gap-3">
                                        <Label htmlFor="level">Level</Label>
                                        <Select value={formData.level} onValueChange={(value) => handleSelectChange('level', value)}>
                                            <SelectTrigger id="level">
                                                <SelectValue placeholder="Select level" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Beginner">Beginner</SelectItem>
                                                <SelectItem value="Intermediate">Intermediate</SelectItem>
                                                <SelectItem value="Advanced">Advanced</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid gap-3">
                                        <Label htmlFor="duration">Duration</Label>
                                        <Input id="duration" type="text" value={formData.duration} onChange={handleChange} />
                                    </div>
                                </div>
                                <div className="grid gap-3">
                                    <Label htmlFor="takeaways">Key Takeaways (one per line)</Label>
                                    <Textarea id="takeaways" value={formData.takeaways!.join('\n')} onChange={handleTakeawaysChange} rows={5} />
                                </div>
                                 {programType !== 'E-Learning' && <div className="grid gap-3">
                                    <Label htmlFor="price">Price</Label>
                                    <Input id="price" type="text" value={formData.price} onChange={handleChange} />
                                </div>}
                            </>
                        )}

                        {isEvent && (
                           <>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                    <div className="grid gap-3">
                                        <Label htmlFor="date">Date</Label>
                                        <Input id="date" type="date" value={formData.date} onChange={handleChange} />
                                    </div>
                                    <div className="grid gap-3">
                                        <Label htmlFor="time">Time</Label>
                                        <Input id="time" type="text" value={formData.time} onChange={handleChange} />
                                    </div>
                                    <div className="grid gap-3">
                                        <Label htmlFor="price">Price</Label>
                                        <Input id="price" type="text" value={formData.price} onChange={handleChange} />
                                    </div>
                                </div>
                                <div className="grid gap-3">
                                    <Label htmlFor="location">Location</Label>
                                    <Input id="location" type="text" value={formData.location} onChange={handleChange} />
                                </div>
                                <div className="grid gap-3">
                                    <Label htmlFor="speakers">Speakers (Name, Title - one per line)</Label>
                                    <Textarea id="speakers" value={formData.speakers!.map(s => `${s.name}, ${s.title}`).join('\n')} onChange={handleSpeakersChange} rows={4} />
                                </div>
                           </>
                        )}

                        <div className="flex gap-4">
                            <Button type="submit" disabled={isUploading}>{isUploading ? 'Saving...' : 'Save Changes'}</Button>
                            <Button type="button" variant="outline" onClick={() => router.back()} disabled={isUploading}>Cancel</Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
