'use client';

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, PlusCircle } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuGroup } from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { useFirestore } from "@/firebase";
import { collection, query } from "firebase/firestore";
import { useCollection } from "@/firebase/firestore/use-collection";
import type { Program } from "@/lib/program-types";
import { useMemo } from "react";
import { deleteProgram } from "@/lib/programs";

export default function OperationsProgramsPage() {
    const firestore = useFirestore();

    const programsQuery = useMemo(() => {
        if (!firestore) return null;
        return query(collection(firestore, "programs"));
    }, [firestore]);

    const { data: programs, loading } = useCollection<Program>(programsQuery);

    const handleDelete = (id: string) => {
        if (firestore && confirm('Are you sure you want to delete this program?')) {
            deleteProgram(firestore, id);
        }
    };

    return (
        <div className="grid gap-6">
             <Card className="bg-primary text-primary-foreground">
                <CardHeader>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <CardTitle className="font-headline text-xl sm:text-2xl">Manage Programs</CardTitle>
                            <CardDescription className="text-primary-foreground/80">View, edit, or add new courses and events.</CardDescription>
                        </div>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="secondary">
                                    <PlusCircle className="mr-2"/>
                                    Create Program
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Program Type</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuGroup>
                                    <DropdownMenuItem asChild>
                                        <Link href="/operations/programs/new?type=core">Core Course</Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                        <Link href="/operations/programs/new?type=elearning">E-Learning Course</Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                        <Link href="/operations/programs/new?type=shortcourse">Short Course</Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                        <Link href="/operations/programs/new?type=event">Event</Link>
                                    </DropdownMenuItem>
                                </DropdownMenuGroup>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </CardHeader>
            </Card>
            <Card>
                <CardContent className="pt-6">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Title</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Level / Date</TableHead>
                                <TableHead className="hidden md:table-cell">Price / Location</TableHead>
                                <TableHead>
                                    <span className="sr-only">Actions</span>
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading && <TableRow><TableCell colSpan={5}>Loading...</TableCell></TableRow>}
                            {programs && programs.map((program) => (
                                <TableRow key={program.id}>
                                    <TableCell className="font-medium">{program.title}</TableCell>
                                    <TableCell>
                                        <Badge variant={program.programType === 'Event' ? 'default' : 'secondary'}>{program.programType}</Badge>
                                    </TableCell>
                                    <TableCell>{program.programType === 'Event' && program.date ? format(new Date(program.date), 'MMM d, yyyy') : program.level}</TableCell>
                                    <TableCell className="hidden md:table-cell">{program.programType === 'Event' ? program.location : program.price}</TableCell>
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
                                                <DropdownMenuItem className="p-0">
                                                    <Link href={`/operations/programs/${program.id}`} className="w-full h-full block px-2 py-1.5">
                                                        Edit
                                                    </Link>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleDelete(program.id)}>Delete</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
