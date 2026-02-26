'use client';
import { useMemo } from 'react';
import { useUser, useUsersFirestore, useCollection, useDoc } from '@/firebase';
import { collection, query, where, doc } from 'firebase/firestore';
import type { Transaction } from '@/lib/transactions-types';
import type { Organization } from '@/lib/organization-types';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, CreditCard, TrendingUp, Calendar, Receipt, CheckCircle, AlertCircle, DollarSign } from "lucide-react";
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export default function BusinessFinancePage() {
    const { user: currentUser, loading: userLoading } = useUser();
    const firestore = useUsersFirestore();

    // Fetch organization
    const orgRef = useMemo(() => {
        if (!firestore || !currentUser?.organizationId) return null;
        return doc(firestore, 'organizations', currentUser.organizationId);
    }, [firestore, currentUser]);

    const { data: org, loading: orgLoading } = useDoc<Organization>(orgRef as any);

    // Fetch all transactions for the organization (by its email domain or adminId)
    const txQuery = useMemo(() => {
        if (!firestore || !currentUser?.email) return null;
        return query(collection(firestore, 'transactions'), where('learnerEmail', '==', currentUser.email));
    }, [firestore, currentUser]);

    const { data: transactions, loading: txLoading } = useCollection<Transaction>(txQuery as any);

    const loading = userLoading || orgLoading || txLoading;

    const totalPaid = transactions?.reduce((sum, tx) => sum + (tx.status === 'Success' ? tx.amount : 0), 0) || 0;
    const successTx = transactions?.filter(tx => tx.status === 'Success') || [];
    const lastPayment = successTx.sort((a, b) => (b.date?.toMillis() || 0) - (a.date?.toMillis() || 0))[0];

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="w-full min-h-screen bg-gray-50/50 p-2 md:p-4 lg:p-6">
            {/* Hero */}
            <div className="bg-primary text-white p-6 mb-6 rounded-tl-3xl rounded-br-3xl rounded-tr-none rounded-bl-none shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-accent/20 rounded-full blur-3xl opacity-20" />
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 bg-accent/20 rounded-xl flex items-center justify-center">
                            <CreditCard className="h-6 w-6 text-accent" />
                        </div>
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold">Finance Overview</h1>
                            <p className="text-white/70 text-sm mt-1">
                                {org?.name} — {org?.tier} Plan
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                        <Badge className={cn(
                            "text-[9px] font-black uppercase tracking-widest border-none px-3 py-1",
                            org?.status === 'Active' ? 'bg-green-500 text-white' : 'bg-amber-500 text-white'
                        )}>
                            {org?.status || 'Active'}
                        </Badge>
                        {org?.subscriptionEndDate && (
                            <p className="text-white/60 text-xs">
                                Expires {format(org.subscriptionEndDate.toDate(), 'MMM d, yyyy')}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Subscription Details */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <Card className="border-primary/10 rounded-tl-2xl rounded-br-2xl rounded-tr-none rounded-bl-none shadow-sm bg-white">
                    <CardContent className="pt-4 pb-4 px-4 flex items-center gap-4">
                        <div className="h-12 w-12 bg-green-50 rounded-xl flex items-center justify-center">
                            <DollarSign className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                            <div className="text-2xl font-black text-primary">KES {totalPaid.toLocaleString()}</div>
                            <p className="text-xs text-primary/50 font-semibold uppercase tracking-widest">Total Invested</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-primary/10 rounded-tl-2xl rounded-br-2xl rounded-tr-none rounded-bl-none shadow-sm bg-white">
                    <CardContent className="pt-4 pb-4 px-4 flex items-center gap-4">
                        <div className="h-12 w-12 bg-accent/10 rounded-xl flex items-center justify-center">
                            <TrendingUp className="h-6 w-6 text-accent" />
                        </div>
                        <div>
                            <div className="text-2xl font-black text-primary">{successTx.length}</div>
                            <p className="text-xs text-primary/50 font-semibold uppercase tracking-widest">Transactions</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-primary/10 rounded-tl-2xl rounded-br-2xl rounded-tr-none rounded-bl-none shadow-sm bg-white">
                    <CardContent className="pt-4 pb-4 px-4 flex items-center gap-4">
                        <div className="h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center">
                            <Calendar className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <div className="text-2xl font-black text-primary">
                                {lastPayment?.date ? format(lastPayment.date.toDate(), 'MMM d') : 'N/A'}
                            </div>
                            <p className="text-xs text-primary/50 font-semibold uppercase tracking-widest">Last Payment</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Subscription Summary Box */}
            <Card className="border-primary/10 rounded-tl-2xl rounded-br-2xl rounded-tr-none rounded-bl-none shadow-sm bg-white mb-6">
                <CardHeader className="pb-3 pt-5 px-6">
                    <CardTitle className="text-sm font-black uppercase tracking-widest text-primary/50">Subscription Details</CardTitle>
                </CardHeader>
                <CardContent className="px-6 pb-5">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <div>
                            <p className="text-xs text-primary/40 uppercase font-black tracking-widest mb-1">Plan</p>
                            <p className="font-bold text-primary">{org?.tier || 'N/A'}</p>
                        </div>
                        <div>
                            <p className="text-xs text-primary/40 uppercase font-black tracking-widest mb-1">Seats</p>
                            <p className="font-bold text-primary">{org?.maxLearners || 'N/A'}</p>
                        </div>
                        <div>
                            <p className="text-xs text-primary/40 uppercase font-black tracking-widest mb-1">Start Date</p>
                            <p className="font-bold text-primary">
                                {org?.createdAt ? format(org.createdAt.toDate(), 'MMM d, yyyy') : 'N/A'}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-primary/40 uppercase font-black tracking-widest mb-1">Expiry Date</p>
                            <p className="font-bold text-primary">
                                {org?.subscriptionEndDate ? format(org.subscriptionEndDate.toDate(), 'MMM d, yyyy') : 'N/A'}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Transaction History */}
            <Card className="border-primary/10 rounded-tl-2xl rounded-br-2xl rounded-tr-none rounded-bl-none shadow-sm bg-white">
                <CardHeader className="pb-3 pt-5 px-6">
                    <CardTitle className="text-sm font-black uppercase tracking-widest text-primary/50">Payment History</CardTitle>
                </CardHeader>
                <CardContent className="px-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-primary/5 border-b border-primary/10">
                                <TableRow className="hover:bg-transparent">
                                    <TableHead className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-primary">Date</TableHead>
                                    <TableHead className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-primary">Description</TableHead>
                                    <TableHead className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-primary">Reference</TableHead>
                                    <TableHead className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-primary">Status</TableHead>
                                    <TableHead className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-primary text-right">Amount</TableHead>
                                    <TableHead className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-primary text-right">Receipt</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody className="divide-y divide-primary/10">
                                {transactions && transactions.map(tx => (
                                    <TableRow key={tx.id} className="hover:bg-primary/5 transition-colors border-primary/10">
                                        <TableCell className="px-6 py-4 text-sm font-medium text-primary/70">
                                            {tx.date ? format(tx.date.toDate(), 'MMM d, yyyy') : 'N/A'}
                                        </TableCell>
                                        <TableCell className="px-6 py-4">
                                            <p className="font-bold text-primary text-sm">{tx.program}</p>
                                        </TableCell>
                                        <TableCell className="px-6 py-4 font-mono text-xs text-primary/50">
                                            {tx.paystackReference || '-'}
                                        </TableCell>
                                        <TableCell className="px-6 py-4">
                                            <div className="flex items-center gap-1.5">
                                                {tx.status === 'Success' ? (
                                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                                ) : (
                                                    <AlertCircle className="h-4 w-4 text-amber-500" />
                                                )}
                                                <Badge className={cn(
                                                    "text-[9px] font-black uppercase tracking-widest border-none",
                                                    tx.status === 'Success' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                                                )}>
                                                    {tx.status}
                                                </Badge>
                                            </div>
                                        </TableCell>
                                        <TableCell className="px-6 py-4 text-right">
                                            <span className="font-black text-primary text-sm">
                                                {tx.currency || 'KES'} {tx.amount?.toLocaleString()}
                                            </span>
                                        </TableCell>
                                        <TableCell className="px-6 py-4 text-right">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 hover:bg-primary/5 rounded-full"
                                                onClick={() => window.open(`/receipt/${tx.id}`, '_blank')}
                                            >
                                                <Receipt className="h-4 w-4 text-primary/60" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {(!transactions || transactions.length === 0) && (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-16 text-primary/40">
                                            <CreditCard className="h-10 w-10 mx-auto mb-3 opacity-30" />
                                            <p className="font-bold uppercase text-xs tracking-widest">No payment history yet</p>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
