'use client';
import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Banknote, TrendingUp, TrendingDown } from "lucide-react";
import { useFirestore, useCollection } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import type { Transaction } from '@/lib/transactions-types';
import { Skeleton } from '@/components/ui/skeleton';

export default function FinanceDashboardPage() {
  const firestore = useFirestore();
  const transactionsQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'transactions'));
  }, [firestore]);

  const { data: transactions, loading } = useCollection<Transaction>(transactionsQuery);

  const stats = useMemo(() => {
    if (!transactions) return { totalRevenue: 0, pendingPayments: 0, successfulCount: 0, failedCount: 0 };

    const totalRevenue = transactions
      .filter(t => t.status === 'Success')
      .reduce((sum, t) => sum + t.amount, 0);

    const pendingPayments = transactions
      .filter(t => t.status === 'Pending')
      .reduce((sum, t) => sum + t.amount, 0);

    const successfulCount = transactions.filter(t => t.status === 'Success').length;
    const failedCount = transactions.filter(t => t.status === 'Failed').length;

    return {
      totalRevenue,
      pendingPayments,
      successfulCount,
      failedCount,
    };
  }, [transactions]);
  
  const StatCard = ({ title, value, icon: Icon, loading, description, formatAsCurrency = false }: { title: string, value: string | number, icon: React.ElementType, loading: boolean, description?: string, formatAsCurrency?: boolean }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {loading ? <Skeleton className="h-8 w-32" /> : (
            <div className="text-2xl font-bold">
                {formatAsCurrency ? `KES ${Number(value).toLocaleString()}` : value}
            </div>
        )}
        {description && !loading && <p className="text-xs text-muted-foreground">{description}</p>}
      </CardContent>
    </Card>
  );

  return (
    <div className="grid gap-6">
      <Card className="bg-primary text-primary-foreground">
        <CardHeader>
          <CardTitle className="font-headline text-xl sm:text-2xl">Finance Dashboard</CardTitle>
          <CardDescription className="text-primary-foreground/80">Overview of financial data.</CardDescription>
        </CardHeader>
      </Card>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Revenue" value={stats.totalRevenue} icon={DollarSign} loading={loading} formatAsCurrency />
        <StatCard title="Pending Payments" value={stats.pendingPayments} icon={Banknote} loading={loading} formatAsCurrency />
        <StatCard title="Successful Transactions" value={stats.successfulCount} icon={TrendingUp} loading={loading} />
        <StatCard title="Failed Transactions" value={stats.failedCount} icon={TrendingDown} loading={loading} />
      </div>
    </div>
  );
}
