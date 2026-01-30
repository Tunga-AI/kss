'use client';
import { useMemo } from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, PlusCircle } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import type { Organization } from '@/lib/organization-types';
import { format } from 'date-fns';

export default function B2BPage() {
  const firestore = useFirestore();
  const orgsQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'organizations'), orderBy('createdAt', 'desc'));
  }, [firestore]);

  const { data: organizations, loading } = useCollection<Organization>(orgsQuery);
  
  const getStatusBadgeVariant = (status: Organization['status']) => {
      switch (status) {
          case 'Active':
              return 'default';
          case 'Trial':
              return 'secondary';
          case 'Expired':
          case 'Cancelled':
              return 'destructive';
          default:
              return 'secondary';
      }
  }

  return (
    <div className="grid gap-6">
      <Card className="bg-primary text-primary-foreground">
        <CardHeader>
           <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle className="font-headline text-xl sm:text-2xl">B2B Management</CardTitle>
                <CardDescription className="text-primary-foreground/80">Manage corporate client accounts and subscriptions.</CardDescription>
              </div>
              <Button variant="secondary" disabled>
                  <PlusCircle className="mr-2"/>
                  Add Organization
              </Button>
          </div>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader>
            <CardTitle>Organizations</CardTitle>
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Organization Name</TableHead>
                        <TableHead>Tier</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Sub. End Date</TableHead>
                        <TableHead>
                            <span className="sr-only">Actions</span>
                        </TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {loading && <TableRow><TableCell colSpan={5}>Loading organizations...</TableCell></TableRow>}
                    {organizations && organizations.map((org) => (
                        <TableRow key={org.id}>
                            <TableCell className="font-medium">{org.name}</TableCell>
                            <TableCell><Badge variant="secondary">{org.tier}</Badge></TableCell>
                            <TableCell>
                                <Badge variant={getStatusBadgeVariant(org.status)}>{org.status}</Badge>
                            </TableCell>
                            <TableCell>{org.subscriptionEndDate ? format(org.subscriptionEndDate.toDate(), 'yyyy-MM-dd') : 'N/A'}</TableCell>
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
                                            <Link href={`/a/b2b/${org.id}`}>View Details</Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem disabled>Manage Subscription</DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    ))}
                    {!loading && organizations?.length === 0 && <TableRow><TableCell colSpan={5} className="text-center">No organizations found.</TableCell></TableRow>}
                </TableBody>
            </Table>
        </CardContent>
      </Card>
    </div>
  );
}
