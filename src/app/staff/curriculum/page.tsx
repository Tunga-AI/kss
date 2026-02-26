'use client';
import { useState, useMemo } from 'react';
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, RefreshCw, BookOpen, Edit, Eye, Trash2, Building, Users } from "lucide-react";
import { useUsersFirestore, useCollection, useUser } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import type { LearningCourse } from '@/lib/learning-types';
import { cn } from "@/lib/utils";
import { deleteLearningCourse } from '@/lib/learning';

export default function StaffCurriculumPage() {
    const firestore = useUsersFirestore();
    const { user } = useUser();
    const [deleting, setDeleting] = useState<string | null>(null);

    const coursesQuery = useMemo(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'learningCourses'), orderBy('createdAt', 'desc'));
    }, [firestore]);

    const { data: allCourses, loading } = useCollection<LearningCourse>(coursesQuery as any);

    const publicCourses = useMemo(() => allCourses?.filter(c => c.cohortId && !c.organizationId) || [], [allCourses]);
    const corporateCourses = useMemo(() => allCourses?.filter(c => c.organizationId) || [], [allCourses]);

    // Deleted handle delete since staff only has view access

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Active': return 'bg-green-500';
            case 'Draft': return 'bg-gray-500';
            case 'Completed': return 'bg-blue-500';
            case 'Archived': return 'bg-red-500';
            default: return 'bg-gray-500';
        }
    };

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
                                <BookOpen className="h-8 w-8 bg-accent/20 p-1.5 rounded-lg text-accent" />
                                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Curriculum Management</h1>
                            </div>
                            <p className="text-white/80 text-lg font-medium">Create and manage structured courses and curriculum units</p>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="bg-white/10 px-6 py-3 rounded-tl-xl rounded-br-xl backdrop-blur-sm border border-white/10">
                                <p className="text-2xl font-bold">{allCourses?.length || 0}</p>
                                <p className="text-[10px] uppercase font-black tracking-widest text-white/60">Total Courses</p>
                            </div>
                            {/* Admin actions hidden */}
                        </div>
                    </div>
                </div>

                <Tabs defaultValue="public" className="w-full">
                    <TabsList className="mb-2 bg-white border border-primary/10 shadow-sm p-1 rounded-tl-xl rounded-br-xl h-auto">
                        <TabsTrigger
                            value="public"
                            className="font-bold text-[10px] md:text-xs uppercase tracking-widest px-4 md:px-8 h-10 md:h-12 data-[state=active]:bg-primary data-[state=active]:text-white transition-all rounded-tl-lg rounded-br-lg flex items-center gap-2"
                        >
                            <Users className="h-4 w-4" />
                            Public Curriculum
                        </TabsTrigger>
                        <TabsTrigger
                            value="corporate"
                            className="font-bold text-[10px] md:text-xs uppercase tracking-widest px-4 md:px-8 h-10 md:h-12 data-[state=active]:bg-primary data-[state=active]:text-white transition-all rounded-tl-lg rounded-br-lg flex items-center gap-2"
                        >
                            <Building className="h-4 w-4" />
                            Corporate Curriculum
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="public" className="m-0 p-0 border-none">
                        <CourseTable courses={publicCourses} getStatusColor={getStatusColor} emptyMessage="No public courses found" />
                    </TabsContent>

                    <TabsContent value="corporate" className="m-0 p-0 border-none">
                        <CourseTable courses={corporateCourses} getStatusColor={getStatusColor} emptyMessage="No corporate courses found" />
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    )
}

function CourseTable({ courses, getStatusColor, emptyMessage }: any) {
    return (
        <div className="w-full bg-white shadow-lg border border-primary/10 overflow-hidden rounded-tl-2xl rounded-br-2xl rounded-tr-none rounded-bl-none">
            <div className="overflow-x-auto">
                <Table className="w-full">
                    <TableHeader className="bg-primary/5 border-b border-primary/10">
                        <TableRow className="hover:bg-transparent">
                            <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest">Course Title</TableHead>
                            <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest">Program</TableHead>
                            <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest text-center">Units</TableHead>
                            <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest text-center">Status</TableHead>
                            <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody className="divide-y divide-primary/10">
                        {courses && courses.map((course: any) => (
                            <TableRow key={course.id} className="hover:bg-primary/5 transition-colors group border-primary/10">
                                <TableCell className="px-6 py-4">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 flex items-center justify-center rounded-tl-lg rounded-br-lg bg-primary/10 text-primary/40 group-hover:bg-accent group-hover:text-white transition-all">
                                            <BookOpen className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-primary leading-tight">{course.title}</p>
                                            <p className="text-[10px] text-primary/40 uppercase font-black mt-1">
                                                {course.cohortName || course.organizationName || course.cohortId || course.organizationId}
                                            </p>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell className="px-6 py-4">
                                    <p className="text-sm font-medium text-primary/80">{course.programTitle || course.programId}</p>
                                </TableCell>
                                <TableCell className="px-6 py-4 text-center">
                                    <span className="text-sm font-bold text-primary/80">{course.unitIds?.length || 0}</span>
                                </TableCell>
                                <TableCell className="px-6 py-4 text-center">
                                    <Badge className={cn(
                                        "rounded-tl-sm rounded-br-sm rounded-tr-none rounded-bl-none font-bold text-[9px] uppercase tracking-widest border-none px-3",
                                        getStatusColor(course.status)
                                    )}>
                                        {course.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="px-6 py-4 text-right">
                                    <div className="flex justify-end gap-2  transition-opacity">
                                        <Button
                                            asChild
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 shadow-none hover:bg-accent/10 rounded-tl-md rounded-br-md rounded-tr-none rounded-bl-none"
                                        >
                                            <Link href={`/f/curriculum/${course.id}`} className="flex items-center gap-2">
                                                <Eye className="h-4 w-4 text-accent" />
                                                View
                                            </Link>
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                        {(!courses || courses.length === 0) && (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-20">
                                    <div className="flex flex-col items-center gap-2">
                                        <BookOpen className="h-12 w-12 text-primary/10" />
                                        <p className="text-primary/40 font-bold uppercase tracking-widest text-xs">{emptyMessage}</p>

                                    </div>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
