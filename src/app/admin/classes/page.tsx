'use client';
import { useMemo } from 'react';
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Eye, RefreshCw, BookOpen, Settings } from "lucide-react";
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import type { Program } from '@/lib/program-types';
import { cn } from "@/lib/utils";

export default function AdminClassesPage() {
    const firestore = useFirestore();
    const programsQuery = useMemo(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'programs'), where('programType', 'in', ['Core', 'Short', 'E-Learning']));
    }, [firestore]);

    const { data: courses, loading } = useCollection<Program>(programsQuery);

    const getPublicPageUrl = (course: Program) => {
        switch (course.programType) {
            case 'Core':
            case 'Short':
                return `/courses/${course.slug}`;
            case 'E-Learning':
                return `/e-learning/${course.slug}`;
            default:
                return '#';
        }
    }

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
                                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">All Classes</h1>
                            </div>
                            <p className="text-white/80 text-lg font-medium">Manage all courses and learning materials</p>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="bg-white/10 px-6 py-3 rounded-tl-xl rounded-br-xl backdrop-blur-sm border border-white/10">
                                <p className="text-2xl font-bold">{courses?.length || 0}</p>
                                <p className="text-[10px] uppercase font-black tracking-widest text-white/60">Total Classes</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Classes Table */}
                <div className="w-full bg-white shadow-lg border border-primary/10 overflow-hidden rounded-tl-2xl rounded-br-2xl rounded-tr-none rounded-bl-none">
                    <div className="overflow-x-auto">
                        <Table className="w-full">
                            <TableHeader className="bg-primary/5 border-b border-primary/10">
                                <TableRow className="hover:bg-transparent">
                                    <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest">Course Title</TableHead>
                                    <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest text-center">Level</TableHead>
                                    <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest text-center hidden md:table-cell">Materials</TableHead>
                                    <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest text-center hidden lg:table-cell">Enrolled</TableHead>
                                    <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody className="divide-y divide-primary/10">
                                {courses && courses.map((course) => (
                                    <TableRow key={course.id} className="hover:bg-primary/5 transition-colors group border-primary/10">
                                        <TableCell className="px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 flex items-center justify-center rounded-tl-lg rounded-br-lg bg-primary/10 text-primary/40 group-hover:bg-accent group-hover:text-white transition-all">
                                                    <BookOpen className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-primary leading-tight">{course.title}</p>
                                                    <p className="text-[10px] text-primary/40 uppercase font-black mt-1">{course.programType}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="px-6 py-4 text-center">
                                            {(course.competencyLevelName || course.level) && (
                                                <Badge className={cn(
                                                    "rounded-tl-sm rounded-br-sm rounded-tr-none rounded-bl-none font-bold text-[9px] uppercase tracking-widest border-none px-3",
                                                    course.level === 'Beginner' ? 'bg-green-500 text-white' :
                                                        course.level === 'Intermediate' ? 'bg-accent text-white' :
                                                            'bg-destructive text-white'
                                                )}>
                                                    {course.competencyLevelName || course.level}
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="px-6 py-4 text-center hidden md:table-cell">
                                            <Badge className="rounded-tl-sm rounded-br-sm bg-accent text-white font-bold">
                                                {course.materials?.length || 0}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="px-6 py-4 text-center hidden lg:table-cell">
                                            <span className="text-sm font-bold text-primary/80">{Math.floor(Math.random() * (50 - 20 + 1)) + 20}</span>
                                        </TableCell>
                                        <TableCell className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2  transition-opacity">
                                                <Button
                                                    asChild
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 shadow-none hover:bg-accent/10 rounded-tl-md rounded-br-md rounded-tr-none rounded-bl-none"
                                                >
                                                    <Link href={`/a/classes/${course.id}`} className="flex items-center gap-2">
                                                        <Settings className="h-4 w-4 text-accent" />
                                                        Manage
                                                    </Link>
                                                </Button>
                                                <Button
                                                    asChild
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 shadow-none hover:bg-primary/5 rounded-tl-md rounded-br-md rounded-tr-none rounded-bl-none"
                                                >
                                                    <Link href={getPublicPageUrl(course)} target="_blank" className="flex items-center gap-2">
                                                        <Eye className="h-4 w-4 text-primary" />
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
                                                <p className="text-primary/40 font-bold uppercase tracking-widest text-xs">No classes found</p>
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
