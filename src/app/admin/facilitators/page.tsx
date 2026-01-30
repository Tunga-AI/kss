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
import { collection, query, where } from 'firebase/firestore';
import type { User } from '@/lib/user-types';
import { format } from 'date-fns';
import { deleteUser } from '@/lib/users';


export default function AdminFacilitatorsPage() {
    const firestore = useFirestore();
    const facilitatorsQuery = useMemo(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'users'), where('role', '==', 'Facilitator'));
    }, [firestore]);

    const { data: facilitators, loading } = useCollection<User>(facilitatorsQuery);

    const handleDelete = (id: string) => {
        if (firestore && confirm('Are you sure you want to delete this facilitator profile? This does not delete their authentication account.')) {
            deleteUser(firestore, id);
        }
    };
    
    return (
        <div className="grid gap-6">
            <Card className="bg-primary text-primary-foreground">
                <CardHeader>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <CardTitle className="font-headline text-xl sm:text-2xl">Manage Facilitators</CardTitle>
                            <CardDescription className="text-primary-foreground/80">View, edit, or add new facilitators to the system.</CardDescription>
                        </div>
                        <Button variant="secondary" asChild>
                            <Link href="/a/facilitators/new">
                                <PlusCircle className="mr-2"/>
                                Create Facilitator
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
                                <TableHead>User</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="hidden sm:table-cell">Date Joined</TableHead>
                                <TableHead>
                                    <span className="sr-only">Actions</span>
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading && <TableRow><TableCell colSpan={4}>Loading...</TableCell></TableRow>}
                            {facilitators && facilitators.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar>
                                                <AvatarImage src={user.avatar} alt={user.name} />
                                                <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-medium">{user.name}</p>
                                                <p className="text-xs sm:text-sm text-muted-foreground">{user.email}</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                     <TableCell>
                                        <Badge variant={user.status === 'Active' ? 'default' : 'destructive'}>{user.status}</Badge>
                                    </TableCell>
                                    <TableCell className="hidden sm:table-cell">{user.createdAt ? format(user.createdAt.toDate(), 'yyyy-MM-dd') : 'N/A'}</TableCell>
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
                                                    <Link href={`/a/users/${user.id}`}>Edit</Link>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem disabled>Reset Password</DropdownMenuItem>
                                                <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(user.id)}>Delete</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                             {!loading && facilitators?.length === 0 && <TableRow><TableCell colSpan={4}>No facilitators found.</TableCell></TableRow>}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
