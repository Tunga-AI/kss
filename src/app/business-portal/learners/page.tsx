'use client';
import { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { useFirestore, useUser, useCollection } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import type { User as LearnerUser } from '@/lib/user-types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { AddLearnerDialog } from './add-learner-dialog';


export default function BusinessLearnersPage() {
  const { user: businessAdmin, loading: adminLoading } = useUser();
  const firestore = useFirestore();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const learnersQuery = useMemo(() => {
    if (!firestore || !businessAdmin?.organizationId) return null;
    return query(collection(firestore, 'users'), where('organizationId', '==', businessAdmin.organizationId));
  }, [firestore, businessAdmin]);

  const { data: learners, loading: learnersLoading } = useCollection<LearnerUser>(learnersQuery);

  const loading = adminLoading || learnersLoading;

  return (
    <>
      <AddLearnerDialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen} organizationId={businessAdmin?.organizationId} />
      <div className="grid gap-6">
        <Card className="bg-primary text-primary-foreground">
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <CardTitle className="font-headline text-xl sm:text-2xl">Manage Learners</CardTitle>
                  <CardDescription className="text-primary-foreground/80">Add, invite, and manage learners in your organization.</CardDescription>
                </div>
                <Button variant="secondary" onClick={() => setIsAddDialogOpen(true)}>
                    <PlusCircle className="mr-2"/>
                    Add Learner
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
                    <TableHead>Status</TableHead>
                    <TableHead>Role</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading && <TableRow><TableCell colSpan={3}>Loading learners...</TableCell></TableRow>}
                  {learners && learners.map(learner => (
                    <TableRow key={learner.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                            <Avatar>
                                <AvatarImage src={learner.avatar} alt={learner.name} />
                                <AvatarFallback>{learner.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="font-medium">{learner.name}</p>
                                <p className="text-xs sm:text-sm text-muted-foreground">{learner.email}</p>
                            </div>
                        </div>
                      </TableCell>
                       <TableCell>
                          <Badge variant={learner.status === 'Active' ? 'default' : 'destructive'}>{learner.status}</Badge>
                      </TableCell>
                       <TableCell>
                          <Badge variant={learner.role === 'BusinessAdmin' ? 'default' : 'secondary'}>{learner.role}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!loading && learners?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="h-24 text-center">No learners have been added to your organization yet.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
        </Card>
      </div>
    </>
  );
}
