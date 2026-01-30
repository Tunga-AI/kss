'use client';
import { useMemo } from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, PlusCircle } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useFirestore, useCollection } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import type { Learner } from '@/lib/learners-types';
import { deleteLearner } from '@/lib/learners';
import { format } from 'date-fns';

export default function AdminLearnersPage() {
    const firestore = useFirestore();
    const learnersQuery = useMemo(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'learners'));
    }, [firestore]);

    const { data: learners, loading } = useCollection<Learner>(learnersQuery);

    const handleDelete = (id: string) => {
        if (firestore && confirm('Are you sure you want to remove this learner profile? This will not delete their main user account.')) {
            deleteLearner(firestore, id);
        }
    };

    return (
        <div className="grid gap-6">
            <Card className="bg-primary text-primary-foreground">
                <CardHeader>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <CardTitle className="font-headline text-xl sm:text-2xl">Manage Learners</CardTitle>
                            <CardDescription className="text-primary-foreground/80">View and manage all enrolled learners.</CardDescription>
                        </div>
                        <Button variant="secondary" asChild>
                            <Link href="/a/learners/new">
                                <PlusCircle className="mr-2"/>
                                Add Learner
                            </Link>
                        </Button>
                    </div>
                </CardHeader>
            </Card>
            <Card>
                <CardContent className="pt-6">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Learner</TableHead>
                                <TableHead>Program</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="hidden sm:table-cell">Date Joined</TableHead>
                                <TableHead>
                                    <span className="sr-only">Actions</span>
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading && <TableRow><TableCell colSpan={5}>Loading...</TableCell></TableRow>}
                            {learners && learners.map((learner) => (
                                <TableRow key={learner.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar>
                                                <AvatarImage src={learner.avatar} alt={learner.name} />
                                                <AvatarFallback>{learner.name.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <Link href={`/a/learners/${learner.id}`} className="hover:underline">
                                                    <p className="font-medium">{learner.name}</p>
                                                </Link>
                                                <p className="text-xs sm:text-sm text-muted-foreground">{learner.email}</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>{learner.program}</TableCell>
                                    <TableCell>
                                        <Badge variant={learner.status === 'Active' ? 'default' : 'secondary'}>{learner.status}</Badge>
                                    </TableCell>
                                    <TableCell className="hidden sm:table-cell">{learner.joinedDate ? format(new Date(learner.joinedDate), 'yyyy-MM-dd') : 'N/A'}</TableCell>
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
                                                <DropdownMenuItem asChild>
                                                  <Link href={`/a/learners/${learner.id}`}>View Details</Link>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleDelete(learner.id)} className="text-destructive">Remove</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {!loading && learners?.length === 0 && <TableRow><TableCell colSpan={5}>No learners found.</TableCell></TableRow>}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
