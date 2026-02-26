'use client';
import type { Event, TicketType } from '@/lib/event-types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRouter } from 'next/navigation';
import { useFirestore, useStorage } from '@/firebase';
import { addEvent, updateEvent } from '@/lib/events';
import React, { useState } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Timestamp } from 'firebase/firestore';
import { parse } from 'date-fns';
import {
    Save, ArrowLeft, Image as ImageIcon, UploadCloud, FileText, Settings2, Plus, Trash2, Tag, Calendar, Globe, MapPin, Users
} from "lucide-react";

export function EventForm({ event }: { event: Partial<Event> }) {
    const isNew = !event.id;

    // Convert Firestore Timestamp to YYYY-MM-DD for standard <input type="date">
    let initialDate = '';
    if (event.date) {
        initialDate = new Date(event.date.toMillis()).toISOString().split('T')[0];
    }
    let initialEndDate = '';
    if (event.endDate) {
        initialEndDate = new Date(event.endDate.toMillis()).toISOString().split('T')[0];
    }

    const [formData, setFormData] = useState<Partial<Event>>({
        title: '',
        slug: '',
        shortDescription: '',
        description: '',
        imageUrl: '',
        time: '',
        location: '',
        address: '',
        eventType: 'Physical',
        status: 'draft',
        currency: 'KES',
        ticketTypes: [],
        facilitators: [],
        ...event,
    });

    // Virtual form states for dates
    const [dateString, setDateString] = useState<string>(initialDate);
    const [endDateString, setEndDateString] = useState<string>(initialEndDate);

    const [imageFile, setImageFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const router = useRouter();
    const firestore = useFirestore();
    const storage = useStorage();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { id, value } = e.target;
        let finalValue: string | number | undefined = value;
        if (id === 'slug') {
            finalValue = value.toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '');
        }
        setFormData(prev => ({ ...prev, [id]: finalValue }));
    };

    const handleSelectChange = (id: string, value: string) => {
        setFormData(prev => ({ ...prev, [id]: value as any }));
    };

    const addTicketType = () => {
        setFormData(prev => ({
            ...prev,
            ticketTypes: [...(prev.ticketTypes || []), { id: Date.now().toString(), name: '', price: 0, capacity: 50, soldCount: 0, description: '' }]
        }));
    };

    const updateTicketType = (idx: number, field: keyof TicketType, value: any) => {
        setFormData(prev => {
            const updated = [...(prev.ticketTypes || [])];
            updated[idx] = { ...updated[idx], [field]: value };
            return { ...prev, ticketTypes: updated };
        });
    };

    const removeTicketType = (idx: number) => {
        setFormData(prev => ({
            ...prev,
            ticketTypes: (prev.ticketTypes || []).filter((_, i) => i !== idx)
        }));
    };

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
            const storageRef = ref(storage, `events/${Date.now()}_${imageFile.name}`);
            await uploadBytes(storageRef, imageFile);
            dataToSave.imageUrl = await getDownloadURL(storageRef);
        }

        if (dateString) {
            const d = new Date(dateString);
            dataToSave.date = Timestamp.fromDate(d);
        }
        if (endDateString) {
            const d = new Date(endDateString);
            dataToSave.endDate = Timestamp.fromDate(d);
        }

        if (dataToSave.id === '') delete dataToSave.id;

        if (isNew) {
            await addEvent(firestore, dataToSave as Omit<Event, 'id' | 'createdAt' | 'updatedAt'>);
        } else if (dataToSave.id) {
            const { id, ...rest } = dataToSave;
            await updateEvent(firestore, id, rest);
        }

        setIsUploading(false);
        router.push('/a/events');
    };

    return (
        <div className="w-full min-h-screen bg-gray-50/50 p-2 md:p-4 font-body">
            <div className="w-full max-w-[1440px] mx-auto">
                {/* Hero Header */}
                <div className="bg-primary text-white p-6 md:p-10 mb-6 border-b border-primary/10 rounded-tl-3xl rounded-br-3xl shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-accent/20 rounded-full blur-3xl opacity-20" />
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="flex items-center gap-6">
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-12 w-12 border-white/20 text-white hover:bg-white hover:text-primary rounded-tl-xl rounded-br-xl transition-all"
                                onClick={() => router.back()}
                            >
                                <ArrowLeft className="h-6 w-6" />
                            </Button>
                            <div>
                                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
                                    {isNew ? 'Create Event' : <>{formData.title}</>}
                                </h1>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Button type="button" variant="ghost" onClick={() => router.back()} className="text-white hover:bg-white/10 font-bold px-6" disabled={isUploading}>
                                Discard
                            </Button>
                            <Button onClick={handleSubmit} disabled={isUploading} className="bg-accent hover:bg-accent/90 text-white border-none h-14 px-8 rounded-tl-2xl rounded-br-2xl font-bold shadow-lg transition-all active:scale-95">
                                {isUploading ? <><UploadCloud className="h-5 w-5 mr-2 animate-spin" /> Saving...</> : <><Save className="h-5 w-5 mr-2" /> Save Event</>}
                            </Button>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                    <div className="xl:col-span-8 space-y-6">
                        {/* Core Identity */}
                        <Card className="bg-white border border-primary/10 rounded-tl-3xl rounded-br-3xl shadow-xl overflow-hidden p-6 md:p-8">
                            <h2 className="text-xl font-bold text-primary mb-8 flex items-center gap-2">
                                <FileText className="h-5 w-5 text-accent" />
                                Event Details
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                <div className="space-y-2">
                                    <Label htmlFor="title" className="text-[10px] uppercase font-black tracking-widest text-primary/40 ml-1">Event Title</Label>
                                    <Input id="title" value={formData.title || ''} onChange={handleChange} required className="h-14 bg-primary/5 border-primary/10 rounded-xl font-medium" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="slug" className="text-[10px] uppercase font-black tracking-widest text-primary/40 ml-1">URL Slug</Label>
                                    <div className="relative">
                                        <Globe className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/30" />
                                        <Input id="slug" value={formData.slug || ''} onChange={handleChange} required className="pl-12 h-14 bg-primary/5 border-primary/10 rounded-xl font-mono text-sm" />
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-2 mb-6">
                                <Label htmlFor="shortDescription" className="text-[10px] uppercase font-black tracking-widest text-primary/40 ml-1">Short Description</Label>
                                <Textarea id="shortDescription" value={formData.shortDescription || ''} onChange={handleChange} rows={2} className="bg-primary/5 border-primary/10 rounded-xl font-medium p-4" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="description" className="text-[10px] uppercase font-black tracking-widest text-primary/40 ml-1">Full Description</Label>
                                <Textarea id="description" value={formData.description || ''} onChange={handleChange} rows={6} className="bg-primary/5 border-primary/10 rounded-xl font-medium p-4" />
                            </div>
                        </Card>

                        {/* Tickets */}
                        <Card className="bg-white border border-primary/10 rounded-tl-3xl rounded-br-3xl shadow-xl p-6 md:p-8">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-primary flex items-center gap-2">
                                    <Tag className="h-5 w-5 text-accent" />
                                    Ticket Types
                                </h2>
                                <Button type="button" onClick={addTicketType} className="bg-accent text-white h-9 px-4 rounded-lg text-sm font-bold">
                                    <Plus className="h-4 w-4 mr-1" /> Add Ticket
                                </Button>
                            </div>

                            {(!formData.ticketTypes || formData.ticketTypes.length === 0) && (
                                <p className="text-sm text-primary/40 italic text-center py-8">No tickets configured. Click "Add Ticket" to begin.</p>
                            )}

                            <div className="space-y-6">
                                {(formData.ticketTypes || []).map((ticket, idx) => (
                                    <div key={idx} className="p-5 bg-primary/5 border border-primary/10 rounded-2xl relative grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="absolute top-2 right-2">
                                            <Button type="button" variant="ghost" onClick={() => removeTicketType(idx)} className="h-8 w-8 p-0 text-red-500 hover:bg-red-50 hover:text-red-700">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-[10px] uppercase font-black tracking-widest text-primary/40">Ticket Name</Label>
                                            <Input value={ticket.name} onChange={(e) => updateTicketType(idx, 'name', e.target.value)} className="h-10 bg-white" placeholder="e.g. Early Bird, VIP" />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-[10px] uppercase font-black tracking-widest text-primary/40">Price</Label>
                                            <Input type="number" value={ticket.price} onChange={(e) => updateTicketType(idx, 'price', Number(e.target.value))} className="h-10 bg-white" placeholder="amount" />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-[10px] uppercase font-black tracking-widest text-primary/40">Capacity</Label>
                                            <Input type="number" value={ticket.capacity} onChange={(e) => updateTicketType(idx, 'capacity', Number(e.target.value))} className="h-10 bg-white" />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-[10px] uppercase font-black tracking-widest text-primary/40">Description</Label>
                                            <Input value={ticket.description || ''} onChange={(e) => updateTicketType(idx, 'description', e.target.value)} className="h-10 bg-white" placeholder="Benefits of this ticket..." />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </div>

                    <div className="xl:col-span-4 space-y-6">
                        {/* Time & Place */}
                        <Card className="bg-white border border-primary/10 rounded-tl-3xl rounded-br-3xl shadow-xl p-8">
                            <h2 className="text-xl font-bold text-primary mb-6 flex items-center gap-2">
                                <Calendar className="h-5 w-5 text-accent" /> Date & Location
                            </h2>
                            <div className="space-y-5">
                                <div className="space-y-2">
                                    <Label className="text-[10px] uppercase font-black tracking-widest text-primary/40 ml-1">Event Start Date</Label>
                                    <Input type="date" value={dateString} onChange={(e) => setDateString(e.target.value)} className="h-12 bg-primary/5 rounded-xl font-bold" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] uppercase font-black tracking-widest text-primary/40 ml-1">Event End Date</Label>
                                    <Input type="date" value={endDateString} onChange={(e) => setEndDateString(e.target.value)} className="h-12 bg-primary/5 rounded-xl font-bold" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="time" className="text-[10px] uppercase font-black tracking-widest text-primary/40 ml-1">Timing (e.g. 09:00 AM - 05:00 PM)</Label>
                                    <Input id="time" value={formData.time || ''} onChange={handleChange} className="h-12 bg-primary/5 rounded-xl font-bold" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] uppercase font-black tracking-widest text-primary/40 ml-1">Event Format</Label>
                                    <Select value={formData.eventType || 'Physical'} onValueChange={(v) => handleSelectChange('eventType', v)}>
                                        <SelectTrigger className="h-12 bg-primary/5 border-primary/10 rounded-xl font-bold">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Physical">Physical / In-Person</SelectItem>
                                            <SelectItem value="Virtual">Virtual / Online</SelectItem>
                                            <SelectItem value="Hybrid">Hybrid</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="location" className="text-[10px] uppercase font-black tracking-widest text-primary/40 ml-1">Location / Venue</Label>
                                    <Input id="location" value={formData.location || ''} onChange={handleChange} className="h-12 bg-primary/5 rounded-xl font-medium" />
                                </div>
                            </div>
                        </Card>

                        {/* Settings */}
                        <Card className="bg-white border border-primary/10 rounded-tl-3xl rounded-br-3xl shadow-xl p-8">
                            <h2 className="text-xl font-bold text-primary mb-6 flex items-center gap-2">
                                <Settings2 className="h-5 w-5 text-accent" /> Configuration
                            </h2>
                            <div className="space-y-5">
                                <div className="space-y-2">
                                    <Label className="text-[10px] uppercase font-black tracking-widest text-primary/40 ml-1">Status</Label>
                                    <Select value={formData.status || 'draft'} onValueChange={(v) => handleSelectChange('status', v)}>
                                        <SelectTrigger className="h-12 bg-primary/5 border-primary/10 rounded-xl font-bold">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="published">Published</SelectItem>
                                            <SelectItem value="draft">Draft</SelectItem>
                                            <SelectItem value="completed">Completed</SelectItem>
                                            <SelectItem value="cancelled">Cancelled</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] uppercase font-black tracking-widest text-primary/40 ml-1">Currency</Label>
                                    <Select value={formData.currency || 'KES'} onValueChange={(v) => handleSelectChange('currency', v)}>
                                        <SelectTrigger className="h-12 bg-primary/5 border-primary/10 rounded-xl font-bold">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="KES">KES</SelectItem>
                                            <SelectItem value="USD">USD</SelectItem>
                                            <SelectItem value="GBP">GBP</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </Card>

                        {/* Image */}
                        <Card className="bg-white border border-primary/10 rounded-tl-3xl rounded-br-3xl shadow-xl p-8">
                            <h2 className="text-xl font-bold text-primary mb-6 flex items-center gap-2">
                                <ImageIcon className="h-5 w-5 text-accent" /> Event Banner
                            </h2>
                            <div className="space-y-4">
                                <div className="relative aspect-video bg-primary/5 rounded-2xl border border-primary/10 flex items-center justify-center overflow-hidden">
                                    {(formData.imageUrl || imageFile) ? (
                                        <img src={imageFile ? URL.createObjectURL(imageFile) : formData.imageUrl} className="w-full h-full object-cover" alt="Preview" />
                                    ) : (
                                        <ImageIcon className="h-10 w-10 text-primary/20" />
                                    )}
                                </div>
                                <Input type="file" onChange={handleImageChange} accept="image/*" className="h-12 bg-primary/5 border-primary/10 rounded-xl font-medium file:mr-4 file:rounded file:border-0 file:bg-primary file:text-white file:px-3 file:text-[10px] file:uppercase file:font-black" />
                            </div>
                        </Card>
                    </div>
                </form>
            </div>
        </div>
    );
}
