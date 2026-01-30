'use client';
import { useMemo } from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, PlusCircle, Users } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useFirestore, useCollection } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import type { Cohort } from '@/lib/cohort-types';
import { deleteCohort } from '@/lib/cohorts';

export default function CohortsPage() {
  const firestore = useFirestore();
  const cohortsQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'cohorts'));
  }, [firestore]);

  const { data: cohorts, loading } = useCollection<Cohort>(cohortsQuery);

  const handleDelete = (id: string) => {
    if (firestore && confirm('Are you sure you want to delete this cohort?')) {
      deleteCohort(firestore, id);
    }
  };

  const getStatusVariant = (status: Cohort['status']) => {
    switch (status) {
        case 'Accepting Applications': return 'default';
        case 'In Review': return 'secondary';
        case 'Closed': return 'destructive';
        default: return 'secondary';
    }
  };

  return (
    <div className="grid gap-6">
      <Card className="bg-primary text-primary-foreground">
        <CardHeader>
           <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle className="font-headline text-xl sm:text-2xl flex items-center gap-2"><Users /> Cohort Management</CardTitle>
                <CardDescription className="text-primary-foreground/80">Create and manage program intakes and admissions councils.</CardDescription>
              </div>
              <Button variant="secondary" asChild>
                  <Link href="/a/cohorts/new">
                    <PlusCircle className="mr-2"/>
                    Create Cohort
                  </Link>
              </Button>
          </div>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader>
            <CardTitle>All Cohorts</CardTitle>
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Cohort Name</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Council Members</TableHead>
                        <TableHead>
                            <span className="sr-only">Actions</span>
                        </TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {loading && <TableRow><TableCell colSpan={4}>Loading cohorts...</TableCell></TableRow>}
                    {cohorts && cohorts.map((cohort) => (
                        <TableRow key={cohort.id}>
                            <TableCell className="font-medium">{cohort.name}</TableCell>
                             <TableCell>
                                <Badge variant={getStatusVariant(cohort.status)}>{cohort.status}</Badge>
                            </TableCell>
                            <TableCell>{cohort.council?.length || 0}</TableCell>
                            <TableCell>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button aria-haspopup="true" size="icon" variant="ghost">
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                        <DropdownMenuItem asChild>
                                            <Link href={`/a/cohorts/${cohort.id}`}>Edit</Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleDelete(cohort.id)} className="text-destructive">Delete</DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    ))}
                    {!loading && cohorts?.length === 0 && <TableRow><TableCell colSpan={4} className="text-center h-24">No cohorts found.</TableCell></TableRow>}
                </TableBody>
            </Table>
        </CardContent>
      </Card>
    </div>
  );
}
