'use client';
import { useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, BookOpen, Plus, RefreshCw, Trash2, FileText, Video, Package, Download, Eye, Save } from "lucide-react";
import { useFirestore, useDoc, useCollection } from '@/firebase';
import { doc, collection, query, orderBy } from 'firebase/firestore';
import type { Program } from '@/lib/program-types';
import type { ContentItem } from '@/lib/content-library-types';
import { updateProgram } from '@/lib/programs';
import { cn } from "@/lib/utils";
import { useToast } from '@/hooks/use-toast';

export default function AdminClassDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const id = Array.isArray(params.id) ? params.id[0] : params.id;
    const firestore = useFirestore();

    const programRef = useMemo(() => {
        if (!firestore || !id) return null;
        return doc(firestore, 'programs', id);
    }, [firestore, id]);

    const { data: program, loading: programLoading } = useDoc<Program>(programRef as any);

    const contentQuery = useMemo(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'contentLibrary'), orderBy('createdAt', 'desc'));
    }, [firestore]);

    const { data: allContent, loading: contentLoading } = useCollection<ContentItem>(contentQuery as any);

    const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Initialize selected materials when program loads
    useMemo(() => {
        if (program?.materials) {
            setSelectedMaterials(program.materials);
        }
    }, [program?.materials]);

    const attachedMaterials = useMemo(() => {
        if (!allContent || !program?.materials) return [];
        return allContent.filter(item => program.materials?.includes(item.id));
    }, [allContent, program?.materials]);

    const availableMaterials = useMemo(() => {
        if (!allContent) return [];
        return allContent.filter(item => item.status === 'published');
    }, [allContent]);

    const handleMaterialToggle = (materialId: string) => {
        setSelectedMaterials(prev =>
            prev.includes(materialId)
                ? prev.filter(id => id !== materialId)
                : [...prev, materialId]
        );
    };

    const handleSaveMaterials = async () => {
        if (!firestore || !program?.id) return;
        setIsSaving(true);

        try {
            await updateProgram(firestore, program.id, { materials: selectedMaterials });
            toast({ title: 'Success', description: 'Learning materials updated successfully.' });
            setIsDialogOpen(false);
        } catch (error) {
            console.error('Error updating materials:', error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to update materials.' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleRemoveMaterial = async (materialId: string) => {
        if (!firestore || !program?.id) return;

        const updatedMaterials = program.materials?.filter(id => id !== materialId) || [];

        try {
            await updateProgram(firestore, program.id, { materials: updatedMaterials });
            setSelectedMaterials(updatedMaterials);
            toast({ title: 'Success', description: 'Material removed successfully.' });
        } catch (error) {
            console.error('Error removing material:', error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to remove material.' });
        }
    };

    const getContentIcon = (type: string) => {
        switch (type) {
            case 'video': return <Video className="h-5 w-5" />;
            case 'document': return <FileText className="h-5 w-5" />;
            case 'scorm': return <Package className="h-5 w-5" />;
            default: return <FileText className="h-5 w-5" />;
        }
    };

    const getContentTypeLabel = (type: string) => {
        const labels: Record<string, string> = {
            video: 'Video',
            document: 'Document',
            scorm: 'SCORM',
            h5p: 'Interactive',
            xapi: 'xAPI',
            image: 'Image',
            audio: 'Audio'
        };
        return labels[type] || type;
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    if (programLoading || contentLoading) {
        return (
            <div className="p-8 flex items-center justify-center min-h-screen">
                <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!program) {
        return (
            <div className="p-8">
                <p>Program not found</p>
            </div>
        );
    }

    return (
        <div className="w-full min-h-screen bg-gray-50/50 p-2 md:p-4 font-body">
            <div className="w-full max-w-[1440px] mx-auto">
                {/* Hero Header */}
                <div className="bg-primary text-white p-6 md:p-10 mb-6 border-b border-primary/10 rounded-tl-3xl rounded-br-3xl rounded-tr-none rounded-bl-none shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-accent/20 rounded-full blur-3xl opacity-20" />

                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="flex items-center gap-6">
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-12 w-12 border-white/20 text-white hover:bg-white hover:text-primary rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none transition-all"
                                onClick={() => router.back()}
                            >
                                <ArrowLeft className="h-6 w-6" />
                            </Button>
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <BookOpen className="h-6 w-6 text-accent" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-white/50">Class Management</span>
                                </div>
                                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
                                    {program.title}
                                </h1>
                                <p className="text-white/70 mt-2">{program.programType} Program</p>
                            </div>
                        </div>

                        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                            <DialogTrigger asChild>
                                <Button className="bg-accent hover:bg-accent/90 text-white border-none h-14 px-8 rounded-tl-2xl rounded-br-2xl rounded-tr-none rounded-bl-none font-bold shadow-lg transition-all active:scale-95">
                                    <Plus className="h-5 w-5 mr-2" />
                                    Add Materials
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl max-h-[80vh]">
                                <DialogHeader>
                                    <DialogTitle className="text-2xl font-bold text-primary">Select Learning Materials</DialogTitle>
                                    <DialogDescription>Choose materials from the content library to attach to this class</DialogDescription>
                                </DialogHeader>

                                <ScrollArea className="h-[500px] pr-4">
                                    <div className="space-y-4">
                                        {availableMaterials.map(material => (
                                            <div
                                                key={material.id}
                                                className={cn(
                                                    "flex items-center justify-between p-4 rounded-xl border-2 transition-all cursor-pointer",
                                                    selectedMaterials.includes(material.id)
                                                        ? "border-accent bg-accent/5"
                                                        : "border-gray-200 hover:border-accent/50"
                                                )}
                                                onClick={() => handleMaterialToggle(material.id)}
                                            >
                                                <div className="flex items-center gap-4 flex-1">
                                                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                                        {getContentIcon(material.type)}
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="font-bold text-primary">{material.title}</p>
                                                        <div className="flex items-center gap-3 mt-1">
                                                            <Badge variant="secondary" className="text-[9px] font-bold">
                                                                {getContentTypeLabel(material.type)}
                                                            </Badge>
                                                            <span className="text-xs text-gray-500">
                                                                {formatFileSize(material.fileSize)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <Checkbox
                                                    checked={selectedMaterials.includes(material.id)}
                                                    onCheckedChange={() => handleMaterialToggle(material.id)}
                                                    className="h-6 w-6"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>

                                <div className="flex justify-end gap-3 pt-4 border-t">
                                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                                        Cancel
                                    </Button>
                                    <Button onClick={handleSaveMaterials} disabled={isSaving} className="bg-accent hover:bg-accent/90">
                                        {isSaving ? (
                                            <><RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Saving...</>
                                        ) : (
                                            <><Save className="h-4 w-4 mr-2" /> Save Changes</>
                                        )}
                                    </Button>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>

                {/* Program Info */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <Card className="p-6 rounded-tl-2xl rounded-br-2xl">
                        <p className="text-xs font-black uppercase tracking-widest text-primary/40 mb-2">Duration</p>
                        <p className="text-2xl font-bold text-primary">{program.duration || 'N/A'}</p>
                    </Card>
                    <Card className="p-6 rounded-tl-2xl rounded-br-2xl">
                        <p className="text-xs font-black uppercase tracking-widest text-primary/40 mb-2">Competency Level</p>
                        <p className="text-2xl font-bold text-primary">
                            {program.competencyLevelName || program.level || 'N/A'}
                        </p>
                    </Card>
                    <Card className="p-6 rounded-tl-2xl rounded-br-2xl">
                        <p className="text-xs font-black uppercase tracking-widest text-primary/40 mb-2">Attached Materials</p>
                        <p className="text-2xl font-bold text-accent">{attachedMaterials.length}</p>
                    </Card>
                </div>

                {/* Learning Materials Table */}
                <Card className="rounded-tl-2xl rounded-br-2xl overflow-hidden">
                    <div className="bg-primary/5 p-6 border-b border-primary/10">
                        <h2 className="text-xl font-bold text-primary flex items-center gap-2">
                            <BookOpen className="h-5 w-5 text-accent" />
                            Learning Materials
                        </h2>
                        <p className="text-sm text-primary/60 mt-1">Materials attached to this class</p>
                    </div>

                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-primary/5 border-b border-primary/10">
                                <TableRow className="hover:bg-transparent">
                                    <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest">Material</TableHead>
                                    <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest text-center">Type</TableHead>
                                    <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest text-center">Size</TableHead>
                                    <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest text-center">Status</TableHead>
                                    <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody className="divide-y divide-primary/10">
                                {attachedMaterials.map((material) => (
                                    <TableRow key={material.id} className="hover:bg-primary/5 transition-colors group border-primary/10">
                                        <TableCell className="px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 flex items-center justify-center rounded-tl-lg rounded-br-lg bg-primary/10 text-primary group-hover:bg-accent group-hover:text-white transition-all">
                                                    {getContentIcon(material.type)}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-primary leading-tight">{material.title}</p>
                                                    <p className="text-xs text-primary/60 mt-1">{material.description.substring(0, 60)}...</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="px-6 py-4 text-center">
                                            <Badge className="rounded-tl-sm rounded-br-sm font-bold text-[9px] uppercase">
                                                {getContentTypeLabel(material.type)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="px-6 py-4 text-center">
                                            <span className="text-sm font-medium text-primary/70">{formatFileSize(material.fileSize)}</span>
                                        </TableCell>
                                        <TableCell className="px-6 py-4 text-center">
                                            <Badge className={cn(
                                                "rounded-tl-sm rounded-br-sm font-bold text-[9px] uppercase",
                                                material.status === 'published' ? 'bg-green-500' : 'bg-gray-500'
                                            )}>
                                                {material.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2  transition-opacity">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8"
                                                    asChild
                                                >
                                                    <a href={material.fileUrl} target="_blank" rel="noopener noreferrer">
                                                        <Eye className="h-4 w-4 text-primary" />
                                                    </a>
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 hover:text-destructive"
                                                    onClick={() => handleRemoveMaterial(material.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {attachedMaterials.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-20">
                                            <div className="flex flex-col items-center gap-2">
                                                <BookOpen className="h-12 w-12 text-primary/10" />
                                                <p className="text-primary/40 font-bold uppercase tracking-widest text-xs">No materials attached yet</p>
                                                <p className="text-primary/30 text-sm">Click "Add Materials" to get started</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </Card>
            </div>
        </div>
    );
}
