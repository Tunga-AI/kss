'use client';
import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useFirestore, useCollection, useUser } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import type { Transaction } from '@/lib/transactions-types';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

export default function LearnerFinancePage() {
  const { user, loading: userLoading } = useUser();
  const firestore = useFirestore();
  
  const transactionsQuery = useMemo(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'transactions'), where('learnerEmail', '==', user.email));
  }, [firestore, user]);
  
  const { data: transactions, loading: transactionsLoading } = useCollection<Transaction>(transactionsQuery);

  const loading = userLoading || transactionsLoading;

  return (
    <div className="grid gap-6">
      <Card className="bg-primary text-primary-foreground">
        <CardHeader>
          <CardTitle className="font-headline text-xl sm:text-2xl">My Transactions</CardTitle>
          <CardDescription className="text-primary-foreground/80">A history of all your program registrations and payments.</CardDescription>
        </CardHeader>
      </Card>
      <Card>
          <CardContent className="pt-6">
              <Table>
                  <TableHeader>
                      <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Program</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Reference</TableHead>
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                      {loading && <TableRow><TableCell colSpan={5}><Skeleton className="h-8 w-full" /></TableCell></TableRow>}
                      {transactions && transactions.map((tx) => (
                          <TableRow key={tx.id}>
                              <TableCell>{tx.date ? format(tx.date.toDate(), 'yyyy-MM-dd') : 'N/A'}</TableCell>
                              <TableCell>{tx.program}</TableCell>
                              <TableCell>{tx.currency} {tx.amount.toLocaleString()}</TableCell>
                              <TableCell>
                                <Badge variant={tx.status === 'Success' ? 'default' : tx.status === 'Failed' ? 'destructive' : 'secondary'}>{tx.status}</Badge>
                              </TableCell>
                              <TableCell className="font-mono text-xs">{tx.paystackReference}</TableCell>
                          </TableRow>
                      ))}
                      {!loading && transactions?.length === 0 && <TableRow><TableCell colSpan={5} className="text-center">You have no transactions yet.</TableCell></TableRow>}
                  </TableBody>
              </Table>
          </CardContent>
      </Card>
    </div>
  );
}
