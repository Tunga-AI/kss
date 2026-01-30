'use client';
import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserCheck, UserX, TrendingUp } from "lucide-react";
import { useFirestore, useCollection } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import type { SaleLead } from '@/lib/sales-types';
import { Skeleton } from '@/components/ui/skeleton';

export default function SalesDashboardPage() {
  const firestore = useFirestore();
  const salesQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'sales'));
  }, [firestore]);
  
  const { data: leads, loading } = useCollection<SaleLead>(salesQuery);

  const stats = useMemo(() => {
    if (!leads) return { total: 0, admitted: 0, lost: 0, conversion: 0 };
    const admitted = leads.filter(l => l.status === 'Admitted').length;
    const lost = leads.filter(l => l.status === 'Lost').length;
    const prospectsAndLeads = leads.filter(l => l.status === 'Prospect' || l.status === 'Lead').length;
    const totalOpportunities = admitted + lost + prospectsAndLeads;
    const conversion = totalOpportunities > 0 ? (admitted / totalOpportunities) * 100 : 0;
    
    return {
      total: prospectsAndLeads,
      admitted,
      lost,
      conversion: conversion.toFixed(1),
    };
  }, [leads]);

  const StatCard = ({ title, value, icon: Icon, loading, description }: { title: string, value: string | number, icon: React.ElementType, loading: boolean, description?: string }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {loading ? <Skeleton className="h-8 w-24" /> : <div className="text-2xl font-bold">{value}</div>}
        {description && !loading && <p className="text-xs text-muted-foreground">{description}</p>}
      </CardContent>
    </Card>
  );

  return (
    <div className="grid gap-6">
      <Card className="bg-primary text-primary-foreground">
        <CardHeader>
          <CardTitle className="font-headline text-xl sm:text-2xl">Sales Dashboard</CardTitle>
          <CardDescription className="text-primary-foreground/80">Overview of sales activities and pipeline.</CardDescription>
        </CardHeader>
      </Card>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Prospects" value={stats.total} icon={Users} loading={loading} />
        <StatCard title="Admitted" value={stats.admitted} icon={UserCheck} loading={loading} />
        <StatCard title="Leads Lost" value={stats.lost} icon={UserX} loading={loading} />
        <StatCard title="Conversion Rate" value={`${stats.conversion}%`} icon={TrendingUp} loading={loading} />
      </div>
    </div>
  );
}
