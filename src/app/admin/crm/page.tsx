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
import { collection, query } from 'firebase/firestore';
import type { SaleLead } from '@/lib/sales-types';

export default function CrmPage() {
  const firestore = useFirestore();
  const salesQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'sales'));
  }, [firestore]);

  const { data: leads, loading } = useCollection<SaleLead>(salesQuery);

  return (
    <div className="grid gap-6">
      <Card className="bg-primary text-primary-foreground">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                  <CardTitle className="font-headline text-xl sm:text-2xl">Customer Relationship Management</CardTitle>
                  <CardDescription className="text-primary-foreground/80">Manage your sales pipeline from prospect to admission.</CardDescription>
              </div>
              <Button variant="secondary">
                  <PlusCircle className="mr-2"/>
                  Add Lead
              </Button>
          </div>
        </CardHeader>
      </Card>
      <Card>
          <CardContent className="pt-6">
              <Table>
                  <TableHeader>
                      <TableRow>
                          <TableHead>Contact</TableHead>
                          <TableHead>Interested Program</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>
                              <span className="sr-only">Actions</span>
                          </TableHead>
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                      {loading && <TableRow><TableCell colSpan={4}>Loading...</TableCell></TableRow>}
                      {leads && leads.map((lead) => (
                          <TableRow key={lead.id}>
                              <TableCell>
                                <Link href={`/a/crm/${lead.id}`} className="hover:underline">
                                  <p className="font-medium">{lead.name}</p>
                                </Link>
                                <p className="text-xs sm:text-sm text-muted-foreground">{lead.email}</p>
                              </TableCell>
                              <TableCell>{lead.program}</TableCell>
                              <TableCell>
                                  <Badge variant={lead.status === 'Admitted' ? 'default' : lead.status === 'Lost' ? 'destructive' : 'secondary'}>{lead.status}</Badge>
                              </TableCell>
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
                                            <Link href={`/a/crm/${lead.id}`}>View Details</Link>
                                          </DropdownMenuItem>
                                          <DropdownMenuItem>Change Status</DropdownMenuItem>
                                          <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                                      </DropdownMenuContent>
                                  </DropdownMenu>
                              </TableCell>
                          </TableRow>
                      ))}
                      {!loading && leads?.length === 0 && <TableRow><TableCell colSpan={4}>No leads found.</TableCell></TableRow>}
                  </TableBody>
              </Table>
          </CardContent>
      </Card>
    </div>
  );
}
