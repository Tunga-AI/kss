'use client';

import { useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useFirestore, useDoc, useCollection } from '@/firebase';
import { doc, collection, query, where } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
    User as UserIcon, Calendar, Receipt, CheckCircle, AlertCircle,
    ArrowLeft, Mail, Phone, MapPin, Wallet
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { Transaction } from '@/lib/transactions-types';
import type { Program } from '@/lib/program-types';
import type { Learner } from '@/lib/learners-types';
import { calculateProgramFinances } from '@/lib/finance-utils';

export default function LearnerFinanceDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const firestore = useFirestore();
    const learnerId = Array.isArray(params.id) ? params.id[0] : params.id;

    // Fetch Learner
    const learnerRef = useMemo(() => firestore && learnerId ? doc(firestore, 'learners', learnerId) : null, [firestore, learnerId]);
    const { data: learner, loading: learnerLoading } = useDoc<Learner>(learnerRef as any);

    // Fetch Transactions (by email)
    const transactionsQuery = useMemo(() => {
        if (!firestore || !learner?.email) return null;
        return query(collection(firestore, 'transactions'), where('learnerEmail', '==', learner.email));
    }, [firestore, learner]);

    const { data: transactions, loading: transactionsLoading } = useCollection<Transaction>(transactionsQuery as any);

    // Fetch Programs (for pricing)
    const programsQuery = useMemo(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'programs'));
    }, [firestore]);

    const { data: programs, loading: programsLoading } = useCollection<Program>(programsQuery as any);

    const loading = learnerLoading || transactionsLoading || programsLoading;

    // Calculate Finances
    const financialDetails = useMemo(() => {
        if (!transactions || !programs) return [];
        return calculateProgramFinances(transactions, programs);
    }, [transactions, programs]);

    const totalSpend = useMemo(() => {
        if (!transactions) return 0;
        return transactions.filter(t => t.status === 'Success').reduce((acc, curr) => acc + curr.amount, 0);
    }, [transactions]);

    const totalOutstanding = useMemo(() => {
        return financialDetails.reduce((acc, curr) => acc + Math.max(0, curr.balance), 0);
    }, [financialDetails]);

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center">Loading Details...</div>;
    }

    if (!learner) {
        return <div className="min-h-screen flex items-center justify-center">Learner not found</div>;
    }

    return (
        <div className="min-h-screen bg-gray-50/50 p-6 md:p-10 font-body">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()} className="h-10 w-10 text-primary hover:bg-primary/5">
                        <ArrowLeft className="h-6 w-6" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold text-primary">{learner.name}</h1>
                        <p className="text-primary/60 flex items-center gap-2 text-sm mt-1">
                            <Mail className="h-4 w-4" /> {learner.email}
                            <span className="text-primary/20">|</span>
                            <span className={cn("uppercase font-bold text-xs tracking-wider", learner.status === 'Active' ? "text-green-600" : "text-primary/40")}>
                                {learner.status}
                            </span>
                        </p>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="bg-white border-primary/10 shadow-sm">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs uppercase font-bold text-primary/40 tracking-widest">Total Paid</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-primary">KSH {totalSpend.toLocaleString()}</div>
                        </CardContent>
                    </Card>
                    <Card className="bg-white border-primary/10 shadow-sm">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs uppercase font-bold text-primary/40 tracking-widest">Outstanding Balance</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-red-500">KSH {totalOutstanding.toLocaleString()}</div>
                        </CardContent>
                    </Card>
                    <Card className="bg-white border-primary/10 shadow-sm">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs uppercase font-bold text-primary/40 tracking-widest">Active Programs</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-primary">{financialDetails.length}</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Program Details */}
                <div className="space-y-6">
                    <h3 className="text-xl font-bold text-primary flex items-center gap-2">
                        <Wallet className="h-5 w-5 text-primary/60" />
                        Program Financial Status
                    </h3>

                    {financialDetails.map((detail, idx) => (
                        <div key={idx} className="bg-white border border-primary/10 rounded-xl overflow-hidden shadow-sm">
                            <div className="p-6 bg-primary/5 border-b border-primary/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                <div>
                                    <h4 className="font-bold text-primary text-lg">{detail.programName}</h4>
                                    <div className="flex flex-wrap items-center gap-3 mt-2">
                                        <Badge variant="outline" className={cn(
                                            "text-[10px] px-2 py-0.5 uppercase tracking-wide border-none font-bold text-white",
                                            detail.status === 'Fully Paid' ? 'bg-green-500' :
                                                detail.status === 'Partially Paid' ? 'bg-amber-500' :
                                                    detail.status === 'Overpaid' ? 'bg-blue-500' :
                                                        detail.status === 'No Payment' ? 'bg-gray-400' : 'bg-gray-400'
                                        )}>
                                            {detail.status}
                                        </Badge>

                                        <div className="flex items-center gap-3 text-xs text-primary/60 font-medium">
                                            {detail.admissionFee > 0 && (
                                                <span title="Admission Fee">
                                                    Adm: <span className="font-mono font-bold text-primary">KSH {detail.admissionFee.toLocaleString()}</span>
                                                </span>
                                            )}
                                            <span title="Program Tuition">
                                                Tuition: <span className="font-mono font-bold text-primary">KSH {detail.programFee.toLocaleString()}</span>
                                            </span>
                                            <span className="font-bold text-primary pl-2 border-l border-primary/20" title="Total Expected Cost">
                                                Total: KSH {detail.totalCost.toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-primary/50 uppercase font-bold tracking-widest">Outstanding Balance</p>
                                    <p className={cn("text-xl font-bold", detail.balance > 0 ? "text-red-500" : "text-green-600")}>
                                        {detail.balance > 0 ? `KSH ${detail.balance.toLocaleString()}` : 'Settled'}
                                    </p>
                                </div>
                            </div>

                            {/* Transaction History */}
                            <div className="p-0">
                                <Table>
                                    <TableHeader className="bg-gray-50/50">
                                        <TableRow className="border-b border-primary/5">
                                            <TableHead className="w-[180px] text-xs font-bold text-primary/40 uppercase tracking-widest">Date</TableHead>
                                            <TableHead className="text-xs font-bold text-primary/40 uppercase tracking-widest">Reference</TableHead>
                                            <TableHead className="text-xs font-bold text-primary/40 uppercase tracking-widest">Purpose</TableHead>
                                            <TableHead className="text-center text-xs font-bold text-primary/40 uppercase tracking-widest">Status</TableHead>
                                            <TableHead className="text-right text-xs font-bold text-primary/40 uppercase tracking-widest">Amount</TableHead>
                                            <TableHead className="text-right text-xs font-bold text-primary/40 uppercase tracking-widest">Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {detail.transactions.map(tx => (
                                            <TableRow key={tx.id} className="hover:bg-primary/5 border-b border-primary/5 last:border-0">
                                                <TableCell className="font-medium text-primary text-sm">
                                                    {format(tx.date ? tx.date.toDate() : new Date(), 'MMM d, yyyy')}
                                                </TableCell>
                                                <TableCell className="font-mono text-xs text-primary/60">
                                                    {tx.paystackReference || 'N/A'}
                                                </TableCell>
                                                <TableCell className="text-xs font-bold uppercase tracking-widest text-primary/60">
                                                    {tx.paymentType || (detail.admissionFee > 0 && tx.amount === detail.admissionFee ? 'Admission' : 'Tuition')}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <span className={cn(
                                                        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                                                        tx.status === 'Success' ? "bg-green-100 text-green-700" :
                                                            tx.status === 'Pending' ? "bg-amber-100 text-amber-700" :
                                                                "bg-red-100 text-red-700"
                                                    )}>
                                                        {tx.status === 'Success' ? <CheckCircle className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                                                        {tx.status}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-right font-bold text-primary text-sm">
                                                    {detail.currency} {tx.amount.toLocaleString()}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 w-8 p-0 rounded-full hover:bg-primary/10 text-primary/60 hover:text-primary"
                                                        onClick={() => window.open(`/receipt/${tx.id}`, '_blank')}
                                                    >
                                                        <Receipt className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {detail.transactions.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center py-6 text-primary/30 text-xs font-medium uppercase tracking-widest">
                                                    No transactions found
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
