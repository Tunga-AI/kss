'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, RefreshCw, Layers, Edit, Trash2, Eye, Settings2, Play } from "lucide-react";
import { useUsersFirestore, useCollection, useUser } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import type { Assessment } from '@/lib/assessment-types';
import { deleteAssessment } from '@/lib/assessments';
import { cn } from "@/lib/utils";

export default function AssessmentsPage() {
    const firestore = useUsersFirestore();
    const { user } = useUser();
    const [searchQuery, setSearchQuery] = useState('');

    const assessmentsQuery = useMemo(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'assessments'));
    }, [firestore]);

    const { data: assessments, loading } = useCollection<Assessment>(assessmentsQuery as any);

    const filteredAssessments = useMemo(() => {
        if (!assessments) return [];
        return assessments.filter(a =>
            a.title.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [assessments, searchQuery]);

    const handleDelete = (id: string) => {
        if (firestore && confirm('Are you sure you want to delete this assessment?')) {
            deleteAssessment(firestore, id);
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
                                <Layers className="h-8 w-8 bg-accent/20 p-1.5 rounded-lg text-accent" />
                                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Assessment Management</h1>
                            </div>
                            <p className="text-white/80 text-lg font-medium">Create and manage admission tests for applicants</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <Button
                                variant="outline"
                                className="border-white/30 text-white hover:bg-white hover:text-primary h-12 px-5 rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none font-bold transition-all"
                                asChild
                            >
                                <Link href="/a/assessments/competencies">
                                    <Settings2 className="h-4 w-4 mr-2" />
                                    Competency Settings
                                </Link>
                            </Button>
                            <Button className="bg-secondary hover:bg-secondary/90 text-white border-none h-12 px-6 rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none font-bold shadow-lg transition-all" asChild>
                                <Link href="/a/assessments/create">
                                    <Plus className="h-4 w-4 mr-2" />
                                    New Assessment
                                </Link>
                            </Button>
                        </div>
                    </div>
                </div>

                {/* List */}
                <div className="w-full bg-white shadow-lg border border-primary/10 overflow-hidden rounded-tl-2xl rounded-br-2xl rounded-tr-none rounded-bl-none">
                    <div className="overflow-x-auto">
                        <Table className="w-full">
                            <TableHeader className="bg-primary/5 border-b border-primary/10">
                                <TableRow className="hover:bg-transparent">
                                    <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest">Title</TableHead>
                                    <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest text-center">Questions</TableHead>
                                    <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody className="divide-y divide-primary/10">
                                {filteredAssessments.length > 0 ? (
                                    filteredAssessments.map((assessment) => (
                                        <TableRow key={assessment.id} className="hover:bg-primary/5 cursor-pointer transition-colors group border-primary/10">
                                            <TableCell className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-primary text-base">{assessment.title}</span>
                                                    <span className="text-xs text-primary/60">{assessment.description}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="px-6 py-4 text-center">
                                                <span className="font-bold text-primary">{assessment.questions?.length || 0}</span>
                                            </TableCell>
                                            <TableCell className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-2  transition-opacity">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        asChild
                                                        className="h-8 shadow-none hover:bg-green-50 hover:text-green-600 rounded-tl-md rounded-br-md rounded-tr-none rounded-bl-none"
                                                    >
                                                        <Link href={`/a/assessments/${assessment.id}/take`}>
                                                            <Play className="h-4 w-4" />
                                                        </Link>
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        asChild
                                                        className="h-8 shadow-none hover:bg-primary/5 rounded-tl-md rounded-br-md rounded-tr-none rounded-bl-none"
                                                    >
                                                        <Link href={`/a/assessments/${assessment.id}`}>
                                                            <Eye className="h-4 w-4 text-primary" />
                                                        </Link>
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        asChild
                                                        className="h-8 shadow-none hover:bg-blue-50 hover:text-blue-600 rounded-tl-md rounded-br-md rounded-tr-none rounded-bl-none"
                                                    >
                                                        <Link href={`/a/assessments/${assessment.id}/edit`}>
                                                            <Edit className="h-4 w-4" />
                                                        </Link>
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 shadow-none hover:bg-accent/10 hover:text-accent rounded-tl-md rounded-br-md rounded-tr-none rounded-bl-none"
                                                        onClick={(e) => { e.stopPropagation(); handleDelete(assessment.id); }}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center py-20 text-primary/40 font-bold uppercase tracking-widest">
                                            No assessments found
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </div>
        </div>
    );
}
