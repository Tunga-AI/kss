'use client';
import { useState, useMemo, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Save, RefreshCw, X, FileText, Plus, Trash2, Video, MapPin, Monitor, Laptop, Image as ImageIcon, Music, Upload } from "lucide-react";
import { useUsersFirestore, useCollection, useUser } from '@/firebase';
import { collection, query, where, addDoc, serverTimestamp } from 'firebase/firestore';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import type { LearningUnit, DeliveryType } from '@/lib/learning-types';
import type { User } from '@/lib/user-types';
import type { ContentItem, ContentType } from '@/lib/content-library-types';
import { createLearningUnit, updateLearningUnit, getLearningUnitsByCourse } from '@/lib/learning';

interface UnitFormDialogProps {
    courseId: string;
    unit?: LearningUnit | null;
    onClose: () => void;
}

export function UnitFormDialog({ courseId, unit, onClose }: UnitFormDialogProps) {
    const firestore = useUsersFirestore();
    const { user } = useUser();

    const [formData, setFormData] = useState({
        title: unit?.title || '',
        description: unit?.description || '',
        deliveryType: (unit?.deliveryType || 'Virtual') as DeliveryType,
        location: unit?.location || '',
        facilitatorId: unit?.facilitatorId || '',
        contentIds: unit?.contentIds || [] as string[],
        status: unit?.status || 'Draft' as 'Draft' | 'Scheduled' | 'In Progress' | 'Completed',
        isRequired: unit?.isRequired ?? true,
        estimatedDuration: unit?.estimatedDuration || 60,
    });

    const [saving, setSaving] = useState(false);
    const [showContentPicker, setShowContentPicker] = useState(false);

    // Upload state
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    // Fetch facilitators
    const facilitatorsQuery = useMemo(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'users'), where('role', '==', 'Facilitator')) as any;
    }, [firestore]);
    const { data: facilitators } = useCollection<User>(facilitatorsQuery as any);

    // Fetch content library items
    const contentQuery = useMemo(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'contentLibrary'), where('status', '==', 'published')) as any;
    }, [firestore]);
    const { data: contentItems } = useCollection<ContentItem>(contentQuery as any);

    // Selected facilitator for display
    const selectedFacilitator = facilitators?.find(f => f.id === formData.facilitatorId);

    // Selected content items
    const selectedContent = contentItems?.filter(c => formData.contentIds.includes(c.id)) || [];

    const getDeliveryTypeIcon = (type: DeliveryType) => {
        switch (type) {
            case 'Virtual': return <Monitor className="h-4 w-4" />;
            case 'Physical': return <MapPin className="h-4 w-4" />;
            case 'Hybrid': return <Laptop className="h-4 w-4" />;
            case 'Self-paced': return <Video className="h-4 w-4" />;
        }
    };

    const getContentTypeIcon = (type: string) => {
        switch (type) {
            case 'video': return <Video className="h-4 w-4 text-purple-500" />;
            case 'document': return <FileText className="h-4 w-4 text-blue-500" />;
            case 'image': return <ImageIcon className="h-4 w-4 text-green-500" />;
            case 'audio': return <Music className="h-4 w-4 text-pink-500" />;
            default: return <FileText className="h-4 w-4 text-gray-500" />;
        }
    };

    // File Upload Handler
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || !e.target.files[0] || !firestore || !user) return;

        const file = e.target.files[0];
        setUploading(true);
        setUploadProgress(0);

        try {
            // 1. Determine Type
            let contentType: ContentType = 'document';
            const fileType = file.type;
            if (fileType.startsWith('video/')) contentType = 'video';
            else if (fileType.startsWith('image/')) contentType = 'image';
            else if (fileType.startsWith('audio/')) contentType = 'audio';
            else if (file.name.endsWith('.zip')) contentType = 'scorm';

            // 2. Upload to Storage
            const storage = getStorage();
            const fileName = `${Date.now()}_${file.name}`;
            const storageRef = ref(storage, `content-library/${contentType}/${fileName}`);
            const uploadTask = uploadBytesResumable(storageRef, file);

            uploadTask.on(
                'state_changed',
                (snapshot) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    setUploadProgress(progress);
                },
                (error) => {
                    console.error('Upload error:', error);
                    alert('Upload failed: ' + error.message);
                    setUploading(false);
                },
                async () => {
                    // 3. Create Content Item
                    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

                    const contentData: any = {
                        title: file.name.replace(/\.[^/.]+$/, ''), // Remove extension for title
                        description: 'Uploaded directly from unit editor',
                        type: contentType,
                        status: 'published', // Auto-publish
                        fileUrl: downloadURL,
                        fileName: file.name,
                        fileSize: file.size,
                        mimeType: file.type,
                        categories: [],
                        tags: ['quick-upload'],
                        visibility: 'public',
                        createdAt: serverTimestamp(),
                        updatedAt: serverTimestamp(),
                        createdBy: user.uid,
                        version: 1,
                        viewCount: 0,
                        downloadCount: 0,
                        usedInCourses: [],
                    };

                    // Add video duration if needed
                    if (contentType === 'video') {
                        const video = document.createElement('video');
                        video.preload = 'metadata';
                        video.onloadedmetadata = async function () {
                            contentData.videoData = { duration: video.duration };
                            const docRef = await addDoc(collection(firestore, 'contentLibrary'), contentData);
                            // 4. Add to Form
                            setFormData(prev => ({ ...prev, contentIds: [...prev.contentIds, docRef.id] }));
                            setUploading(false);
                            setUploadProgress(0);
                        };
                        video.src = downloadURL;
                    } else {
                        const docRef = await addDoc(collection(firestore, 'contentLibrary'), contentData);
                        // 4. Add to Form
                        setFormData(prev => ({ ...prev, contentIds: [...prev.contentIds, docRef.id] }));
                        setUploading(false);
                        setUploadProgress(0);
                    }
                }
            );
        } catch (error) {
            console.error('Error uploading file:', error);
            alert('An error occurred during upload.');
            setUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!firestore || !user) return;

        if (!formData.title) {
            alert('Please enter a unit title');
            return;
        }

        try {
            setSaving(true);

            if (unit) {
                // Update existing unit
                await updateLearningUnit(firestore, unit.id, {
                    ...formData,
                    facilitatorName: selectedFacilitator?.name,
                    facilitatorEmail: selectedFacilitator?.email,
                    updatedBy: user.uid,
                });
            } else {
                // Create new unit - get next order index
                const existingUnits = await getLearningUnitsByCourse(firestore, courseId);
                const orderIndex = existingUnits.length;

                await createLearningUnit(firestore, {
                    ...formData,
                    courseId,
                    orderIndex,
                    facilitatorName: selectedFacilitator?.name,
                    facilitatorEmail: selectedFacilitator?.email,
                    createdBy: user.uid,
                });
            }

            onClose();
        } catch (error) {
            console.error('Error saving unit:', error);
            alert('Failed to save unit');
        } finally {
            setSaving(false);
        }
    };

    const handleAddContent = (contentId: string) => {
        if (!formData.contentIds.includes(contentId)) {
            setFormData({ ...formData, contentIds: [...formData.contentIds, contentId] });
        }
    };

    const handleRemoveContent = (contentId: string) => {
        setFormData({ ...formData, contentIds: formData.contentIds.filter(id => id !== contentId) });
    };



    return (
        <Dialog open onOpenChange={onClose}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-primary text-xl">
                        {unit ? 'Edit Unit' : 'Add New Unit'}
                    </DialogTitle>
                    <DialogDescription>
                        {unit ? 'Update unit details and assignments' : 'Create a new unit/class in this course'}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 mt-4">
                    {/* Title */}
                    <div className="space-y-2">
                        <Label htmlFor="title" className="text-primary font-bold text-xs uppercase tracking-widest">
                            Unit Title *
                        </Label>
                        <Input
                            id="title"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            placeholder="e.g., Introduction to Sales Fundamentals"
                            className="border-primary/20 rounded-tl-lg rounded-br-lg"
                            required
                        />
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <Label htmlFor="description" className="text-primary font-bold text-xs uppercase tracking-widest">
                            Description
                        </Label>
                        <Textarea
                            id="description"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Brief description of what this unit covers"
                            className="border-primary/20 rounded-tl-lg rounded-br-lg min-h-[80px]"
                            rows={3}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Delivery Type */}
                        <div className="space-y-2">
                            <Label htmlFor="deliveryType" className="text-primary font-bold text-xs uppercase tracking-widest">
                                Delivery Type
                            </Label>
                            <Select
                                value={formData.deliveryType}
                                onValueChange={(value: DeliveryType) => setFormData({ ...formData, deliveryType: value })}
                            >
                                <SelectTrigger className="border-primary/20 rounded-tl-lg rounded-br-lg">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Virtual">
                                        <div className="flex items-center gap-2">
                                            <Monitor className="h-4 w-4" />
                                            <span>Virtual (Online)</span>
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="Physical">
                                        <div className="flex items-center gap-2">
                                            <MapPin className="h-4 w-4" />
                                            <span>Physical (In-Person)</span>
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="Hybrid">
                                        <div className="flex items-center gap-2">
                                            <Laptop className="h-4 w-4" />
                                            <span>Hybrid</span>
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="Self-paced">
                                        <div className="flex items-center gap-2">
                                            <Video className="h-4 w-4" />
                                            <span>Self-paced</span>
                                        </div>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Location (for Physical/Hybrid) */}
                    {(formData.deliveryType === 'Physical' || formData.deliveryType === 'Hybrid') && (
                        <div className="space-y-2">
                            <Label htmlFor="location" className="text-primary font-bold text-xs uppercase tracking-widest">
                                Location
                            </Label>
                            <Input
                                id="location"
                                value={formData.location}
                                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                placeholder="e.g., Training Room A, Floor 2"
                                className="border-primary/20 rounded-tl-lg rounded-br-lg"
                            />
                        </div>
                    )}

                    {/* Facilitator Selection */}
                    <div className="space-y-2">
                        <Label htmlFor="facilitator" className="text-primary font-bold text-xs uppercase tracking-widest">
                            Assign Facilitator
                        </Label>
                        <Select
                            value={formData.facilitatorId || 'none'}
                            onValueChange={(value) => setFormData({ ...formData, facilitatorId: value === 'none' ? '' : value })}
                        >
                            <SelectTrigger className="border-primary/20 rounded-tl-lg rounded-br-lg">
                                <SelectValue placeholder="Select a facilitator" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">No facilitator</SelectItem>
                                {facilitators?.map((facilitator) => (
                                    <SelectItem key={facilitator.id} value={facilitator.id}>
                                        {facilitator.name} ({facilitator.email})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Content Library Selection */}
                    <div className="space-y-2">
                        <Label className="text-primary font-bold text-xs uppercase tracking-widest">
                            Course Materials
                        </Label>
                        <p className="text-xs text-primary/60 mb-2">
                            Add learning materials from the library or upload new files
                        </p>

                        {/* Upload Progress */}
                        {uploading && (
                            <div className="mb-4 bg-primary/5 p-4 rounded-lg border border-primary/10">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs font-bold uppercase tracking-widest text-primary">Uploading...</span>
                                    <span className="text-xs font-bold text-primary">{Math.round(uploadProgress)}%</span>
                                </div>
                                <div className="w-full bg-primary/10 rounded-full h-2 overflow-hidden">
                                    <div className="bg-accent h-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                                </div>
                            </div>
                        )}

                        {/* Selected Content */}
                        {selectedContent.length > 0 && (
                            <div className="space-y-2 mb-3">
                                {selectedContent.map((content) => (
                                    <Card key={content.id} className="p-3 border-primary/10">
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-2">
                                                {getContentTypeIcon(content.type)}
                                                <div>
                                                    <p className="text-sm font-medium text-primary">{content.title}</p>
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant="outline" className="text-xs capitalize">{content.type}</Badge>
                                                        <Badge variant={content.status === 'published' ? 'default' : 'secondary'} className="text-[10px] uppercase h-5">
                                                            {content.status}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </div>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleRemoveContent(content.id)}
                                                className="text-red-500 hover:text-red-600"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        )}

                        {/* Action Buttons */}
                        {!showContentPicker && !uploading && (
                            <div className="grid grid-cols-2 gap-3">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setShowContentPicker(true)}
                                    className="border-primary/20 rounded-tl-lg rounded-br-lg"
                                    disabled={saving}
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    From Library
                                </Button>
                                <div className="relative">
                                    <input
                                        type="file"
                                        id="quick-unit-upload"
                                        className="hidden"
                                        onChange={handleFileUpload}
                                        disabled={saving}
                                        accept="video/*,image/*,audio/*,.pdf,.doc,.docx,.ppt,.pptx,.zip"
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="w-full border-primary/20 rounded-tl-lg rounded-br-lg border-dashed"
                                        disabled={saving}
                                        onClick={() => document.getElementById('quick-unit-upload')?.click()}
                                    >
                                        <Upload className="h-4 w-4 mr-2" />
                                        Upload New
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Content Picker */}
                        {showContentPicker && (
                            <Card className="p-4 border-primary/20 max-h-60 overflow-y-auto">
                                <div className="flex justify-between items-center mb-3">
                                    <p className="text-sm font-bold text-primary uppercase tracking-widest">Select Content</p>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setShowContentPicker(false)}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                                <div className="space-y-2">
                                    {contentItems?.filter(c => !formData.contentIds.includes(c.id)).map((content) => (
                                        <div
                                            key={content.id}
                                            className="p-2 border border-primary/10 rounded-md hover:bg-primary/5 cursor-pointer"
                                            onClick={() => handleAddContent(content.id)}
                                        >
                                            <div className="flex items-center gap-2">
                                                {getContentTypeIcon(content.type)}
                                                <div className="flex-1">
                                                    <p className="text-sm font-medium text-primary">{content.title}</p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <Badge variant="outline" className="text-xs capitalize">{content.type}</Badge>
                                                        {content.categories?.map((cat) => (
                                                            <Badge key={cat} variant="outline" className="text-xs">{cat}</Badge>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {contentItems?.filter(c => !formData.contentIds.includes(c.id)).length === 0 && (
                                        <p className="text-sm text-primary/60 text-center py-4">No more content available</p>
                                    )}
                                </div>
                            </Card>
                        )}
                    </div>

                    {/* Settings Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        {/* Status */}
                        <div className="space-y-2">
                            <Label htmlFor="status" className="text-primary font-bold text-xs uppercase tracking-widest">
                                Status
                            </Label>
                            <Select value={formData.status} onValueChange={(value: any) => setFormData({ ...formData, status: value })}>
                                <SelectTrigger className="border-primary/20 rounded-tl-lg rounded-br-lg">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Draft">Draft</SelectItem>
                                    <SelectItem value="Scheduled">Scheduled</SelectItem>
                                    <SelectItem value="In Progress">In Progress</SelectItem>
                                    <SelectItem value="Completed">Completed</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Estimated Duration */}

                        <div className="space-y-2">
                            <Label htmlFor="estimatedDuration" className="text-primary font-bold text-xs uppercase tracking-widest">
                                Estimated Duration (minutes)
                            </Label>
                            <Input
                                id="estimatedDuration"
                                type="number"
                                min="0"
                                value={formData.estimatedDuration}
                                onChange={(e) => setFormData({ ...formData, estimatedDuration: parseInt(e.target.value) })}
                                className="border-primary/20 rounded-tl-lg rounded-br-lg"
                            />
                        </div>

                        {/* Required */}
                        <div className="space-y-2 flex items-end">
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="isRequired"
                                    checked={formData.isRequired}
                                    onChange={(e) => setFormData({ ...formData, isRequired: e.target.checked })}
                                    className="h-4 w-4 text-accent border-primary/20 rounded"
                                />
                                <Label htmlFor="isRequired" className="text-sm cursor-pointer">
                                    Required unit
                                </Label>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-4 border-t border-primary/10">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            className="border-primary/20 rounded-tl-lg rounded-br-lg"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={saving || uploading}
                            className="bg-accent hover:bg-accent/90 text-white rounded-tl-lg rounded-br-lg"
                        >
                            {saving ? (
                                <>
                                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="h-4 w-4 mr-2" />
                                    {unit ? 'Update Unit' : 'Create Unit'}
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
