'use client';
import { useState, useMemo } from 'react';
import Link from "next/link";
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, RefreshCw, Monitor, Edit, BookOpen, Layers } from "lucide-react";
import { useFirestore, useCollection, useUser } from '@/firebase';
import { collection, query, where, addDoc, Timestamp } from 'firebase/firestore';
import type { LearningCourse } from '@/lib/learning-types';
import type { Program } from '@/lib/program-types';
import { cn } from "@/lib/utils";

export default function AdminElearningPage() {
    const firestore = useFirestore();
    const router = useRouter();
    const { user } = useUser();
    const [setupLoading, setSetupLoading] = useState<string | null>(null);

    // 1. Fetch E-Learning Programs
    const programsQuery = useMemo(() => {
        if (!firestore) return null;
        return query(
            collection(firestore, 'programs'),
            where('programType', '==', 'E-Learning')
        );
    }, [firestore]);

    const { data: programs, loading: programsLoading } = useCollection<Program>(programsQuery as any);

    // 2. Fetch Existing Learning Courses (to map to programs)
    const coursesQuery = useMemo(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'learningCourses'));
    }, [firestore]);

    const { data: courses, loading: coursesLoading } = useCollection<LearningCourse>(coursesQuery as any);

    // Map Program ID -> Course
    const programCourseMap = useMemo(() => {
        const map = new Map<string, LearningCourse>();
        courses?.forEach(course => {
            if (course.programId) {
                map.set(course.programId, course);
            }
        });
        return map;
    }, [courses]);

    const handleSetupContent = async (program: Program) => {
        if (!firestore || !user) return;

        try {
            setSetupLoading(program.id);

            // Create a new course linked to this program
            const courseData = {
                title: program.title,
                description: program.description,
                programId: program.id,
                programTitle: program.title,
                cohortId: '',
                cohortName: '',
                unitIds: [],
                status: 'Draft',
                isPublished: false,
                isSelfPaced: true,
                allowSkipUnits: true,
                level: program.level || 'Beginner',
                category: 'E-Learning',
                thumbnailUrl: program.imageUrl,
                createdBy: user.uid,
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now(),
            };

            const docRef = await addDoc(collection(firestore, 'learningCourses'), courseData);

            // Redirect to editor
            router.push(`/a/curriculum/${docRef.id}`);

        } catch (error) {
            console.error("Error creating course:", error);
            alert("Failed to setup course content.");
            setSetupLoading(null);
        }
    };

    if (programsLoading || coursesLoading) {
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
                                <Monitor className="h-8 w-8 bg-accent/20 p-1.5 rounded-lg text-accent" />
                                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">E-Learning Programs</h1>
                            </div>
                            <p className="text-white/80 text-lg font-medium">Manage content for your E-Learning programs</p>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="bg-white/10 px-6 py-3 rounded-tl-xl rounded-br-xl backdrop-blur-sm border border-white/10">
                                <p className="text-2xl font-bold">{programs?.length || 0}</p>
                                <p className="text-[10px] uppercase font-black tracking-widest text-white/60">Total Programs</p>
                            </div>
                            <Button
                                asChild
                                className="bg-secondary hover:bg-secondary/90 text-white h-12 px-6 rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none font-bold transition-all"
                            >
                                <Link href="/admin/programs">
                                    <Layers className="h-4 w-4 mr-2" />
                                    Manage Programs
                                </Link>
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Programs Table */}
                <div className="w-full bg-white shadow-lg border border-primary/10 overflow-hidden rounded-tl-2xl rounded-br-2xl rounded-tr-none rounded-bl-none">
                    <div className="overflow-x-auto">
                        <Table className="w-full">
                            <TableHeader className="bg-primary/5 border-b border-primary/10">
                                <TableRow className="hover:bg-transparent">
                                    <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest">Program Title</TableHead>
                                    <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest">Level</TableHead>
                                    <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest text-center">Content Status</TableHead>
                                    <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest text-center">Modules</TableHead>
                                    <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody className="divide-y divide-primary/10">
                                {programs && programs.length > 0 ? (
                                    programs.map((program) => {
                                        const course = programCourseMap.get(program.id);
                                        const hasContent = !!course;

                                        return (
                                            <TableRow key={program.id} className="hover:bg-primary/5 transition-colors group border-primary/10">
                                                <TableCell className="px-6 py-4">
                                                    <div className="flex items-center gap-4">
                                                        <div className="h-10 w-10 flex items-center justify-center rounded-tl-lg rounded-br-lg bg-primary/10 text-primary/40 group-hover:bg-accent group-hover:text-white transition-all">
                                                            <BookOpen className="h-5 w-5" />
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-primary leading-tight">{program.title}</p>
                                                            <p className="text-xs text-primary/60 truncate max-w-[200px]">{program.description}</p>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="px-6 py-4">
                                                    <Badge variant="outline" className="text-xs text-primary/60 border-primary/20">
                                                        {program.level || 'All Levels'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="px-6 py-4 text-center">
                                                    {hasContent ? (
                                                        <Badge className="bg-green-500 rounded-tl-sm rounded-br-sm rounded-tr-none rounded-bl-none font-bold text-[9px] uppercase tracking-widest border-none px-3">
                                                            Configured
                                                        </Badge>
                                                    ) : (
                                                        <Badge className="bg-gray-400 rounded-tl-sm rounded-br-sm rounded-tr-none rounded-bl-none font-bold text-[9px] uppercase tracking-widest border-none px-3">
                                                            No Content
                                                        </Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell className="px-6 py-4 text-center">
                                                    <span className="text-sm font-bold text-primary/80">
                                                        {course?.unitIds?.length || 0}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="px-6 py-4 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        {hasContent ? (
                                                            <Button
                                                                asChild
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-8 shadow-none hover:bg-accent/10 rounded-tl-md rounded-br-md rounded-tr-none rounded-bl-none border border-accent/20"
                                                            >
                                                                <Link href={`/a/curriculum/${course!.id}`} className="flex items-center gap-2 text-accent">
                                                                    <Edit className="h-4 w-4" />
                                                                    Manage Content
                                                                </Link>
                                                            </Button>
                                                        ) : (
                                                            <Button
                                                                variant="default" // Primary style for "Setup"
                                                                size="sm"
                                                                className="h-8 bg-primary hover:bg-primary/90 text-white rounded-tl-md rounded-br-md rounded-tr-none rounded-bl-none"
                                                                onClick={() => handleSetupContent(program)}
                                                                disabled={setupLoading === program.id}
                                                            >
                                                                {setupLoading === program.id ? (
                                                                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                                                                ) : (
                                                                    <Plus className="h-4 w-4 mr-2" />
                                                                )}
                                                                Setup Content
                                                            </Button>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-20">
                                            <div className="flex flex-col items-center gap-2">
                                                <Monitor className="h-12 w-12 text-primary/10" />
                                                <p className="text-primary/40 font-bold uppercase tracking-widest text-xs">No E-Learning Programs Found</p>
                                                <Button
                                                    asChild
                                                    className="mt-4 bg-secondary hover:bg-secondary/90 text-white rounded-tl-lg rounded-br-lg rounded-tr-none rounded-bl-none"
                                                >
                                                    <Link href="/admin/programs">
                                                        Create Program in Programs Module
                                                    </Link>
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
        </div>
    )
}
