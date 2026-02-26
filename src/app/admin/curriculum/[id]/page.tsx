'use client';
import { useState, useMemo, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Plus, Edit, Trash2, RefreshCw, BookOpen, User, FileText, Copy, MapPin, Monitor, Laptop, Video, Calendar, PlayCircle } from "lucide-react";
import { useFirestore, useDoc, useCollection, useUser } from '@/firebase';
import { doc, collection, query, where, orderBy } from 'firebase/firestore';
import { format } from 'date-fns';
import type { LearningCourse, LearningModule, DeliveryType } from '@/lib/learning-types';
import type { Cohort } from '@/lib/cohort-types';
import { deleteLearningUnit, updateLearningCourse, duplicateLearningCourse, allocateCourseToChort } from '@/lib/learning';
import { cn } from "@/lib/utils";
import { UnitFormDialog } from './unit-form-dialog';

export default function CurriculumDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const firestore = useFirestore();
    const { user } = useUser();

    const [showModuleDialog, setShowModuleDialog] = useState(false);
    const [editingModule, setEditingModule] = useState<LearningModule | null>(null);
    const [deleting, setDeleting] = useState<string | null>(null);
    const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
    const [showAllocateDialog, setShowAllocateDialog] = useState(false);
    const [duplicating, setDuplicating] = useState(false);
    const [allocating, setAllocating] = useState(false);
    const [duplicateData, setDuplicateData] = useState({ title: '', cohortId: '' });
    const [allocateCohortId, setAllocateCohortId] = useState('');

    // Fetch course
    const courseDoc = useMemo(() => {
        if (!firestore) return null;
        return doc(firestore, 'learningCourses', id);
    }, [firestore, id]);
    const { data: course, loading: courseLoading } = useDoc<LearningCourse>(courseDoc as any);

    // Fetch modules
    const modulesQuery = useMemo(() => {
        if (!firestore) return null;
        return query(
            collection(firestore, 'learningUnits'),
            where('courseId', '==', id),
            orderBy('orderIndex', 'asc')
        );
    }, [firestore, id]);
    const { data: modules, loading: modulesLoading } = useCollection<LearningModule>(modulesQuery as any);

    // Fetch cohorts for duplicate dialog
    const cohortsQuery = useMemo(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'cohorts'));
    }, [firestore]);
    const { data: cohorts } = useCollection<Cohort>(cohortsQuery as any);

    const handleDeleteModule = async (moduleId: string) => {
        if (!firestore || !confirm('Are you sure you want to delete this module?')) return;

        try {
            setDeleting(moduleId);
            await deleteLearningUnit(firestore, moduleId);
        } catch (error) {
            console.error('Error deleting module:', error);
            alert('Failed to delete module');
        } finally {
            setDeleting(null);
        }
    };

    const handleEditModule = (module: LearningModule) => {
        setEditingModule(module);
        setShowModuleDialog(true);
    };

    const handleCloseDialog = () => {
        setShowModuleDialog(false);
        setEditingModule(null);
    };

    const handleDuplicate = async () => {
        if (!firestore || !user || !course) return;

        try {
            setDuplicating(true);
            const selectedCohort = cohorts?.find(c => c.id === duplicateData.cohortId);

            const newCourseId = await duplicateLearningCourse(firestore, id, {
                title: duplicateData.title || `${course.title} (Copy)`,
                cohortId: duplicateData.cohortId || undefined,
                cohortName: selectedCohort?.name,
                createdBy: user.uid,
            });

            setShowDuplicateDialog(false);
            setDuplicateData({ title: '', cohortId: '' });
            router.push(`/a/curriculum/${newCourseId}`);
        } catch (error) {
            console.error('Error duplicating course:', error);
            alert('Failed to duplicate course');
        } finally {
            setDuplicating(false);
        }
    };

    const handleAllocate = async () => {
        if (!firestore || !allocateCohortId) return;

        try {
            setAllocating(true);
            const selectedCohort = cohorts?.find(c => c.id === allocateCohortId);

            await allocateCourseToChort(firestore, id, allocateCohortId, selectedCohort?.name);

            setShowAllocateDialog(false);
            setAllocateCohortId('');
        } catch (error) {
            console.error('Error allocating course:', error);
            alert('Failed to allocate course');
        } finally {
            setAllocating(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Scheduled':
            case 'Active': return 'bg-green-500';
            case 'Draft': return 'bg-gray-500';
            case 'In Progress': return 'bg-blue-500';
            case 'Completed': return 'bg-purple-500';
            default: return 'bg-gray-500';
        }
    };

    const getDeliveryTypeIcon = (type: DeliveryType) => {
        switch (type) {
            case 'Virtual': return <Monitor className="h-4 w-4 text-blue-500" />;
            case 'Physical': return <MapPin className="h-4 w-4 text-green-500" />;
            case 'Hybrid': return <Laptop className="h-4 w-4 text-purple-500" />;
            case 'Self-paced': return <Video className="h-4 w-4 text-orange-500" />;
            default: return <Monitor className="h-4 w-4 text-gray-500" />;
        }
    };

    const getDeliveryTypeBadge = (type: DeliveryType) => {
        const colors = {
            'Virtual': 'bg-blue-100 text-blue-700 border-blue-200',
            'Physical': 'bg-green-100 text-green-700 border-green-200',
            'Hybrid': 'bg-purple-100 text-purple-700 border-purple-200',
            'Self-paced': 'bg-orange-100 text-orange-700 border-orange-200',
        };
        return colors[type] || 'bg-gray-100 text-gray-700 border-gray-200';
    };

    if (courseLoading || modulesLoading) {
        return (
            <div className="p-8 flex items-center justify-center min-h-screen">
                <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!course) {
        return (
            <div className="p-8 flex items-center justify-center min-h-screen">
                <p className="text-primary/60">Course not found</p>
            </div>
        );
    }

    return (
        <div className="w-full min-h-screen bg-gray-50/50 p-2 md:p-4 font-body">
            <div className="w-full">
                {/* Hero Section */}
                <div className="bg-primary text-white p-6 mb-6 border-b border-primary/10 rounded-tl-3xl rounded-br-3xl rounded-tr-none rounded-bl-none shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-accent/20 rounded-full blur-3xl opacity-20" />

                    <div className="relative z-10">
                        <Button
                            variant="ghost"
                            onClick={() => router.push('/a/curriculum')}
                            className="mb-4 gap-2 text-white/80 hover:text-white hover:bg-white/10 p-0 h-auto font-normal hover:bg-transparent"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back to Curriculum
                        </Button>

                        <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="bg-white/10 p-2 rounded-lg backdrop-blur-sm">
                                        <BookOpen className="h-6 w-6 text-accent" />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {course.sourceId && (
                                            <Badge variant="outline" className="rounded-tl-sm rounded-br-sm text-xs border-white/20 text-white/60">
                                                Copy of {course.duplicatedFrom}
                                            </Badge>
                                        )}
                                        <Badge className={cn(
                                            "rounded-tl-sm rounded-br-sm rounded-tr-none rounded-bl-none font-bold text-[10px] uppercase tracking-widest border-none px-3",
                                            getStatusColor(course.status)
                                        )}>
                                            {course.status}
                                        </Badge>
                                    </div>
                                </div>
                                <h1 className="text-3xl font-bold tracking-tight mb-2 text-white">{course.title}</h1>
                                <p className="text-white/80 text-lg font-medium max-w-2xl">{course.description}</p>

                                <div className="flex flex-wrap gap-2 mt-4">
                                    {course.isSelfPaced && (
                                        <Badge variant="secondary" className="bg-white/10 text-white border-none hover:bg-white/20">
                                            Self-paced
                                        </Badge>
                                    )}
                                    {course.allowSkipUnits && (
                                        <Badge variant="secondary" className="bg-white/10 text-white border-none hover:bg-white/20">
                                            Flexible Path
                                        </Badge>
                                    )}
                                </div>
                            </div>

                            <div className="flex flex-col items-end gap-3">
                                <div className="flex items-center gap-2">
                                    <Button
                                        asChild
                                        className="bg-white/10 hover:bg-white/20 text-white border border-white/10 rounded-tl-lg rounded-br-lg"
                                    >
                                        <Link href={`/admin/curriculum/${id}/play`}>
                                            <PlayCircle className="h-4 w-4 mr-2" />
                                            Play Content
                                        </Link>
                                    </Button>
                                    <Button
                                        onClick={() => {
                                            setDuplicateData({ title: `${course.title} (Copy)`, cohortId: '' });
                                            setShowDuplicateDialog(true);
                                        }}
                                        className="bg-white/10 hover:bg-white/20 text-white border border-white/10 rounded-tl-lg rounded-br-lg"
                                    >
                                        <Copy className="h-4 w-4 mr-2" />
                                        Duplicate
                                    </Button>
                                    <Button
                                        onClick={() => setShowModuleDialog(true)}
                                        className="bg-accent hover:bg-accent/90 text-white rounded-tl-lg rounded-br-lg font-bold shadow-lg shadow-accent/20"
                                    >
                                        <Plus className="h-4 w-4 mr-2" />
                                        Add Module
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Course Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <Card className="border-primary/10 shadow-sm hover:shadow-md transition-shadow rounded-tl-xl rounded-br-xl">
                        <CardContent className="p-4 flex items-center gap-4">
                            <div className="bg-blue-50 p-3 rounded-lg">
                                <BookOpen className="h-6 w-6 text-blue-500" />
                            </div>
                            <div>
                                <p className="text-[10px] uppercase font-black tracking-widest text-primary/40">Program</p>
                                <p className="font-bold text-primary truncate" title={course.programTitle || course.programId}>
                                    {course.programTitle || course.programId}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-primary/10 shadow-sm hover:shadow-md transition-shadow rounded-tl-xl rounded-br-xl">
                        <CardContent className="p-4 flex items-center gap-4">
                            <div className="bg-purple-50 p-3 rounded-lg">
                                <User className="h-6 w-6 text-purple-500" />
                            </div>
                            <div className="flex-1">
                                <p className="text-[10px] uppercase font-black tracking-widest text-primary/40">Cohort</p>
                                {course.cohortName || course.cohortId ? (
                                    <p className="font-bold text-primary truncate" title={course.cohortName || course.cohortId}>
                                        {course.cohortName || course.cohortId}
                                    </p>
                                ) : (
                                    <div className="flex items-center justify-between">
                                        <span className="text-primary/40 text-sm italic">Unassigned</span>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => setShowAllocateDialog(true)}
                                            className="h-6 text-[10px] text-accent hover:text-accent/80 p-0"
                                        >
                                            Allocate
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-primary/10 shadow-sm hover:shadow-md transition-shadow rounded-tl-xl rounded-br-xl">
                        <CardContent className="p-4 flex items-center gap-4">
                            <div className="bg-green-50 p-3 rounded-lg">
                                <FileText className="h-6 w-6 text-green-500" />
                            </div>
                            <div>
                                <p className="text-[10px] uppercase font-black tracking-widest text-primary/40">Total Modules</p>
                                <p className="font-bold text-primary text-xl">{modules?.length || 0}</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-primary/10 shadow-sm hover:shadow-md transition-shadow rounded-tl-xl rounded-br-xl">
                        <CardContent className="p-4 flex items-center gap-4">
                            <div className="bg-orange-50 p-3 rounded-lg">
                                <Calendar className="h-6 w-6 text-orange-500" />
                            </div>
                            <div>
                                <p className="text-[10px] uppercase font-black tracking-widest text-primary/40">Duration</p>
                                <p className="font-bold text-primary text-xl">{course.totalWeeks || 12} Weeks</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Modules List */}
                <div className="w-full bg-white shadow-lg border border-primary/10 overflow-hidden rounded-tl-2xl rounded-br-2xl rounded-tr-none rounded-bl-none">
                    <div className="p-4 border-b border-primary/10 bg-primary/5 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <h2 className="font-bold text-primary uppercase tracking-widest text-sm">Course Modules</h2>
                            <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-none">
                                {modules?.length || 0}
                            </Badge>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-slate-50 border-b border-primary/10">
                                <TableRow className="hover:bg-transparent">
                                    <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest w-16">No.</TableHead>
                                    <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest">Module Information</TableHead>
                                    <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest">Delivery Mode</TableHead>
                                    <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest">Facilitator</TableHead>
                                    <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest text-center">Date & Time</TableHead>
                                    <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest text-center">Content</TableHead>
                                    <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest text-center">Status</TableHead>
                                    <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody className="divide-y divide-primary/5">
                                {modules && modules.map((module, index) => (
                                    <TableRow key={module.id} className="hover:bg-primary/5 transition-colors group">
                                        <TableCell className="px-6 py-4">
                                            <span className="font-mono text-primary/40 text-sm">#{index + 1}</span>
                                        </TableCell>
                                        <TableCell className="px-6 py-4">
                                            <div>
                                                <p className="font-bold text-primary text-sm">{module.title}</p>
                                                {module.description && (
                                                    <p className="text-xs text-primary/50 mt-1 line-clamp-1 max-w-[300px]">{module.description}</p>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <Badge
                                                    variant="outline"
                                                    className={cn("text-[10px] capitalize px-2 py-0.5 rounded-sm font-medium border border-opacity-30", getDeliveryTypeBadge(module.deliveryType))}
                                                >
                                                    {getDeliveryTypeIcon(module.deliveryType)}
                                                    <span className="ml-1">{module.deliveryType || 'Virtual'}</span>
                                                </Badge>
                                            </div>
                                            {module.location && (
                                                <div className="flex items-center gap-1 mt-1 text-[10px] text-primary/50">
                                                    <MapPin className="h-3 w-3" />
                                                    <span className="truncate max-w-[150px]">{module.location}</span>
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell className="px-6 py-4">
                                            {module.facilitatorName ? (
                                                <div className="flex items-center gap-2">
                                                    <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                                                        {module.facilitatorName.charAt(0)}
                                                    </div>
                                                    <span className="text-sm text-primary/80">{module.facilitatorName}</span>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-primary/40 italic">Unassigned</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="px-6 py-4">
                                            {module.scheduledStartDate ? (
                                                <div className="flex flex-col gap-1 items-center justify-center">
                                                    <span className="text-xs font-bold text-primary whitespace-nowrap">
                                                        {format(module.scheduledStartDate.toDate(), 'MMM d, yyyy')}
                                                    </span>
                                                    <span className="text-[10px] text-primary/60 whitespace-nowrap">
                                                        {format(module.scheduledStartDate.toDate(), 'h:mm a')}
                                                        {module.scheduledEndDate ? ` - ${format(module.scheduledEndDate.toDate(), 'h:mm a')}` : ''}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-primary/40 italic flex justify-center">Not Scheduled</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="px-6 py-4 text-center">
                                            <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-100">
                                                <FileText className="h-3.5 w-3.5 text-slate-500" />
                                                <span className="text-xs font-bold text-slate-700">{module.contentIds?.length || 0}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="px-6 py-4 text-center">
                                            <Badge className={cn(
                                                "rounded-sm font-bold text-[9px] uppercase tracking-wider border-none px-2 py-0.5",
                                                getStatusColor(module.status)
                                            )}>
                                                {module.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-1 opacity-100">
                                                {(module.deliveryType === 'Virtual' || module.deliveryType === 'Hybrid') && (
                                                    <Button
                                                        asChild
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 shadow-none hover:bg-green-50 text-green-600 rounded-md font-bold text-xs"
                                                    >
                                                        <Link href={`/a/curriculum/${course.id}/live/${module.id}`} className="flex items-center gap-1.5">
                                                            <Video className="h-3.5 w-3.5" />
                                                            Live
                                                        </Link>
                                                    </Button>
                                                )}
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 w-8 p-0 hover:bg-accent/10 hover:text-accent rounded-md"
                                                    onClick={() => handleEditModule(module)}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-500 rounded-md"
                                                    onClick={() => handleDeleteModule(module.id)}
                                                    disabled={deleting === module.id}
                                                >
                                                    {deleting === module.id ? (
                                                        <RefreshCw className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <Trash2 className="h-4 w-4" />
                                                    )}
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {(!modules || modules.length === 0) && (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center py-16">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="bg-primary/5 p-4 rounded-full">
                                                    <BookOpen className="h-8 w-8 text-primary/20" />
                                                </div>
                                                <p className="text-primary/40 font-bold uppercase tracking-widest text-xs">No modules found</p>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => setShowModuleDialog(true)}
                                                    className="mt-2 border-primary/20 text-primary hover:bg-primary/5"
                                                >
                                                    <Plus className="h-3 w-3 mr-2" />
                                                    Add First Module
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </div>

            {/* Module Form Dialog */}
            {showModuleDialog && (
                <UnitFormDialog
                    courseId={id}
                    unit={editingModule}
                    onClose={handleCloseDialog}
                />
            )}

            {/* Duplicate Course Dialog */}
            <Dialog open={showDuplicateDialog} onOpenChange={setShowDuplicateDialog}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-primary">Duplicate Course</DialogTitle>
                        <DialogDescription>
                            Create a copy of this course with all its modules. You can assign it to a different cohort.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                        <div className="space-y-2">
                            <Label className="text-primary font-bold text-xs uppercase tracking-widest">
                                New Course Title
                            </Label>
                            <Input
                                value={duplicateData.title}
                                onChange={(e) => setDuplicateData({ ...duplicateData, title: e.target.value })}
                                placeholder={`${course.title} (Copy)`}
                                className="border-primary/20 rounded-tl-lg rounded-br-lg"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-primary font-bold text-xs uppercase tracking-widest">
                                Allocate to Cohort (Optional)
                            </Label>
                            <Select
                                value={duplicateData.cohortId}
                                onValueChange={(value) => setDuplicateData({ ...duplicateData, cohortId: value })}
                            >
                                <SelectTrigger className="border-primary/20 rounded-tl-lg rounded-br-lg">
                                    <SelectValue placeholder="Select a cohort" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">No cohort</SelectItem>
                                    {cohorts?.map((cohort) => (
                                        <SelectItem key={cohort.id} value={cohort.id}>
                                            {cohort.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex justify-end gap-3 pt-4">
                            <Button
                                variant="outline"
                                onClick={() => setShowDuplicateDialog(false)}
                                className="border-primary/20 rounded-tl-lg rounded-br-lg"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleDuplicate}
                                disabled={duplicating}
                                className="bg-accent hover:bg-accent/90 text-white rounded-tl-lg rounded-br-lg"
                            >
                                {duplicating ? (
                                    <>
                                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                        Duplicating...
                                    </>
                                ) : (
                                    <>
                                        <Copy className="h-4 w-4 mr-2" />
                                        Duplicate Course
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Allocate to Cohort Dialog */}
            <Dialog open={showAllocateDialog} onOpenChange={setShowAllocateDialog}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-primary">Allocate to Cohort</DialogTitle>
                        <DialogDescription>
                            Assign this course to a cohort. Learners in this cohort will be able to access the course.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                        <div className="space-y-2">
                            <Label className="text-primary font-bold text-xs uppercase tracking-widest">
                                Select Cohort
                            </Label>
                            <Select value={allocateCohortId} onValueChange={setAllocateCohortId}>
                                <SelectTrigger className="border-primary/20 rounded-tl-lg rounded-br-lg">
                                    <SelectValue placeholder="Select a cohort" />
                                </SelectTrigger>
                                <SelectContent>
                                    {cohorts?.map((cohort) => (
                                        <SelectItem key={cohort.id} value={cohort.id}>
                                            {cohort.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex justify-end gap-3 pt-4">
                            <Button
                                variant="outline"
                                onClick={() => setShowAllocateDialog(false)}
                                className="border-primary/20 rounded-tl-lg rounded-br-lg"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleAllocate}
                                disabled={allocating || !allocateCohortId}
                                className="bg-accent hover:bg-accent/90 text-white rounded-tl-lg rounded-br-lg"
                            >
                                {allocating ? (
                                    <>
                                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                        Allocating...
                                    </>
                                ) : (
                                    <>
                                        <Calendar className="h-4 w-4 mr-2" />
                                        Allocate Course
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
