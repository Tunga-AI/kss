'use client';
import { useMemo } from 'react';
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, Eye } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import type { Program } from '@/lib/program-types';

export default function StaffClassesPage() {
    const firestore = useFirestore();
    const programsQuery = useMemo(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'programs'), where('programType', 'in', ['Core', 'Short', 'E-Learning']));
    }, [firestore]);

    const { data: courses, loading } = useCollection<Program>(programsQuery);

    const getPublicPageUrl = (course: Program) => {
        switch(course.programType) {
            case 'Core':
            case 'Short':
                return `/courses/${course.slug}`;
            case 'E-Learning':
                return `/e-learning/${course.slug}`;
            default:
                return '#';
        }
    }

    return (
        <div className="grid gap-6">
            <Card className="bg-primary text-primary-foreground">
                <CardHeader>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <CardTitle className="font-headline text-xl sm:text-2xl">My Classes</CardTitle>
                            <CardDescription className="text-primary-foreground/80">Manage your assigned courses and interact with your learners.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
            </Card>
            <Card>
                <CardContent className="pt-6">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Course Title</TableHead>
                                <TableHead>Level</TableHead>
                                <TableHead className="hidden md:table-cell">Enrolled Learners</TableHead>
                                <TableHead>
                                    <span className="sr-only">Actions</span>
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading && <TableRow><TableCell colSpan={4}>Loading...</TableCell></TableRow>}
                            {courses && courses.map((course) => (
                                <TableRow key={course.id}>
                                    <TableCell className="font-medium">{course.title}</TableCell>
                                    <TableCell>
                                        {course.level && <Badge variant={course.level === 'Beginner' ? 'secondary' : course.level === 'Intermediate' ? 'default' : 'destructive'}>{course.level}</Badge>}
                                    </TableCell>
                                    <TableCell className="hidden md:table-cell">{Math.floor(Math.random() * (50 - 20 + 1)) + 20}</TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button aria-haspopup="true" size="icon" variant="ghost">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                    <span className="sr-only">Toggle menu</span>
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuItem>View Roster</DropdownMenuItem>
                                                <DropdownMenuItem>Send Announcement</DropdownMenuItem>
                                                <DropdownMenuItem>Grade Submissions</DropdownMenuItem>
                                                <DropdownMenuItem className="p-0">
                                                    <Link href={getPublicPageUrl(course)} target="_blank" className="w-full h-full block px-2 py-1.5">
                                                        <Eye className="mr-2 h-4 w-4 inline-block"/>
                                                        View Public Page
                                                    </Link>
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {!loading && courses?.length === 0 && <TableRow><TableCell colSpan={4}>No classes found.</TableCell></TableRow>}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
