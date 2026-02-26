'use client';
import { useMemo, useState, useEffect } from 'react';
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Eye, RefreshCw, BookOpen, Settings, Layers, Calendar } from "lucide-react";
import { useUsersFirestore, useCollection, useUser } from '@/firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import type { LearningModule } from '@/lib/learning-types';
import { format } from 'date-fns';
import { cn } from "@/lib/utils";

export default function StaffModulesPage() {
    const firestore = useUsersFirestore();
    const { user } = useUser();
    const [coursesMap, setCoursesMap] = useState<Record<string, any>>({});

    const modulesQuery = useMemo(() => {
        if (!firestore || !user?.id) return null;
        return query(collection(firestore, 'learningUnits'), where('facilitatorId', '==', user.id));
    }, [firestore, user?.id]);

    const { data: modules, loading } = useCollection<LearningModule>(modulesQuery as any);

    useEffect(() => {
        const fetchCourses = async () => {
            if (!firestore || !modules) return;
            const uniqueCourseIds = Array.from(new Set(modules.map(m => m.courseId)));
            if (uniqueCourseIds.length === 0) return;

            const newCoursesMap: Record<string, any> = {};
            for (const courseId of uniqueCourseIds) {
                if (!courseId) continue;
                try {
                    const courseDoc = await getDoc(doc(firestore, 'learningCourses', courseId));
                    if (courseDoc.exists()) {
                        newCoursesMap[courseId] = courseDoc.data();
                    }
                } catch (error) {
                    console.error('Error fetching course:', error);
                }
            }
            setCoursesMap(newCoursesMap);
        };

        fetchCourses();
    }, [firestore, modules]);

    if (loading) {
        return (
            <div className="p-8 flex items-center justify-center min-h-screen">
                <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="w-full min-h-screen bg-gray-50/50 p-2 md:p-4 font-body">
            <div className="w-full">
                {/* Hero Section */}
                <div className="bg-primary text-white p-6 mb-6 border-b border-primary/10 rounded-tl-3xl rounded-br-3xl rounded-tr-none rounded-bl-none shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-accent/20 rounded-full blur-3xl opacity-20" />

                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <Layers className="h-8 w-8 bg-accent/20 p-1.5 rounded-lg text-accent" />
                                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">My Modules</h1>
                            </div>
                            <p className="text-white/80 text-lg font-medium">Manage your allocated curriculum units and upload content</p>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="bg-white/10 px-6 py-3 rounded-tl-xl rounded-br-xl backdrop-blur-sm border border-white/10">
                                <p className="text-2xl font-bold">{modules?.length || 0}</p>
                                <p className="text-[10px] uppercase font-black tracking-widest text-white/60">Total Modules</p>
                            </div>
                            <Button
                                variant="outline"
                                className="border-white text-white hover:bg-white hover:text-primary h-12 px-6 rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none font-bold transition-all"
                                onClick={() => window.location.reload()}
                            >
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Refresh
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Modules Table */}
                <div className="w-full bg-white shadow-lg border border-primary/10 overflow-hidden rounded-tl-2xl rounded-br-2xl rounded-tr-none rounded-bl-none">
                    <div className="overflow-x-auto">
                        <Table className="w-full">
                            <TableHeader className="bg-primary/5 border-b border-primary/10">
                                <TableRow className="hover:bg-transparent">
                                    <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest">Module</TableHead>
                                    <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest">Parent Course</TableHead>
                                    <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest text-center">Delivery</TableHead>
                                    <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest text-center">Schedule</TableHead>
                                    <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody className="divide-y divide-primary/10">
                                {modules && modules.map((module) => {
                                    const parentCourse = coursesMap[module.courseId];

                                    return (
                                        <TableRow key={module.id} className="hover:bg-primary/5 transition-colors group border-primary/10">
                                            <TableCell className="px-6 py-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-10 w-10 flex items-center justify-center rounded-tl-lg rounded-br-lg bg-primary/10 text-primary/40 group-hover:bg-accent group-hover:text-white transition-all font-bold">
                                                        {module.orderIndex || '#'}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-primary leading-tight">{module.title}</p>
                                                        <p className="text-[10px] text-primary/40 uppercase font-black mt-1 line-clamp-1 max-w-[200px]">{module.description}</p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-primary">{parentCourse?.title || 'Loading...'}</span>
                                                    <span className="text-[10px] uppercase font-black text-primary/40 mt-1">{parentCourse?.programTitle || parentCourse?.programId}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="px-6 py-4 text-center">
                                                <Badge className={cn(
                                                    "rounded-tl-sm rounded-br-sm rounded-tr-none rounded-bl-none font-bold text-[9px] uppercase tracking-widest border-none px-3",
                                                    module.deliveryType === 'Virtual' ? 'bg-blue-500 text-white' :
                                                        module.deliveryType === 'Physical' ? 'bg-orange-500 text-white' :
                                                            'bg-purple-500 text-white'
                                                )}>
                                                    {module.deliveryType || 'Self-paced'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="px-6 py-4 text-center">
                                                {module.scheduledStartDate ? (
                                                    <div className="flex flex-col items-center justify-center gap-1 text-xs text-primary/80">
                                                        <Calendar className="h-3.5 w-3.5 text-primary/60" />
                                                        <span className="font-bold">{format(module.scheduledStartDate.toDate(), 'MMM d, yyyy')}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-primary/40 italic">Not Scheduled</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-2 transition-opacity">
                                                    <Button
                                                        asChild
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 shadow-none hover:bg-accent/10 hover:text-accent rounded-tl-md rounded-br-md rounded-tr-none rounded-bl-none font-bold"
                                                    >
                                                        <Link href={`/f/curriculum/unit/${module.id}`} className="flex items-center gap-2">
                                                            <Settings className="h-4 w-4 text-accent" />
                                                            Manage Content
                                                        </Link>
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                                {(!modules || modules.length === 0) && (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-20">
                                            <div className="flex flex-col items-center gap-2">
                                                <Layers className="h-12 w-12 text-primary/10" />
                                                <p className="text-primary/40 font-bold uppercase tracking-widest text-xs">No assigned modules</p>
                                                <p className="text-sm text-primary/30 mt-1">You haven't been allocated to any learning modules yet.</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </div>
        </div>
    )
}
