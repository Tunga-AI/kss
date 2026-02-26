'use client';

import { useMemo } from 'react';
import { useParams, notFound } from 'next/navigation';
import { useFirestore, useDoc } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { Transaction } from '@/lib/transactions-types';
import type { BrandingSettings } from '@/lib/settings-types';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Printer, CheckCircle2, XCircle } from 'lucide-react';
import { cn } from "@/lib/utils";
import Image from 'next/image';

export default function ReceiptPage() {
    const params = useParams();
    const id = Array.isArray(params.id) ? params.id[0] : params.id;
    const firestore = useFirestore();

    const txRef = useMemo(() => firestore && id ? doc(firestore, 'transactions', id) : null, [firestore, id]);
    const { data: transaction, loading } = useDoc<Transaction>(txRef as any);

    // Fetch Branding Settings
    const settingsRef = useMemo(() => firestore ? doc(firestore, 'settings', 'branding') : null, [firestore]);
    const { data: settings } = useDoc<BrandingSettings>(settingsRef as any);

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center">Loading Receipt...</div>;
    }

    if (!transaction) {
        return notFound();
    }

    const isPaid = transaction.status === 'Success';

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 print:p-0 print:bg-white">
            <div className="bg-white p-8 md:p-12 max-w-2xl w-full shadow-2xl rounded-3xl border border-gray-200 print:shadow-none print:border-none print:w-full print:max-w-none">

                {/* Header */}
                <div className="flex justify-between items-start mb-8 border-b pb-8">
                    <div>
                        {settings?.logoUrl ? (
                            <div className="relative h-16 w-48 mb-4">
                                <Image
                                    src={settings.logoUrl}
                                    alt="Logo"
                                    fill
                                    className="object-contain object-left"
                                />
                            </div>
                        ) : (
                            <h1 className="text-3xl font-black uppercase tracking-tighter text-primary">KSS Institute</h1>
                        )}
                        <p className="text-gray-500 font-mono text-sm mt-1">Receipt #{transaction.id}</p>
                    </div>
                    <div className="text-right">
                        <div className="font-bold text-xl text-primary">Receipt</div>
                        <p className="text-sm text-gray-400">Nairobi, Kenya</p>
                    </div>
                </div>

                {/* Status Banner */}
                <div className={cn(
                    "mb-8 p-4 rounded-xl flex items-center justify-between",
                    isPaid ? "bg-green-50 text-green-900 border border-green-100" : "bg-red-50 text-red-900 border border-red-100"
                )}>
                    <div className="flex items-center gap-3">
                        {isPaid ? <CheckCircle2 className="h-6 w-6 text-green-600" /> : <XCircle className="h-6 w-6 text-red-600" />}
                        <span className="font-bold uppercase tracking-widest text-xs">
                            {isPaid ? "Payment Successful" : "Payment in Review / Failed"}
                        </span>
                    </div>
                    {transaction.date && (
                        <span className="text-sm font-medium opacity-70">
                            {format(transaction.date.toDate(), 'PPP')}
                        </span>
                    )}
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-8 mb-8">
                    <div>
                        <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-2">Billed To</h3>
                        <p className="font-bold text-lg text-gray-900">{transaction.learnerName}</p>
                        <p className="text-gray-500 font-medium text-sm">{transaction.learnerEmail}</p>
                    </div>
                    <div className="text-right">
                        <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-2">Paystack Reference</h3>
                        <p className="font-mono text-sm font-bold text-gray-700">{transaction.paystackReference || 'N/A'}</p>
                    </div>
                </div>

                {/* Line Items */}
                <div className="bg-gray-50 border border-gray-100 rounded-2xl p-6 mb-8">
                    <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-200/60 last:border-0 last:mb-0 last:pb-0">
                        <div>
                            <p className="font-bold text-gray-900">{transaction.program}</p>
                            <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mt-1">Program Enrollment</p>
                        </div>
                        <p className="font-mono font-bold text-lg text-gray-900">
                            {transaction.currency} {transaction.amount.toLocaleString()}
                        </p>
                    </div>
                </div>

                {/* Total */}
                <div className="flex justify-end items-center gap-4 mb-12">
                    <p className="text-sm font-bold uppercase tracking-widest text-gray-400">Total Paid</p>
                    <p className="text-3xl font-black text-gray-900 tracking-tight">
                        <span className="text-lg align-top mr-1 font-medium text-gray-400">{transaction.currency}</span>
                        {transaction.amount.toLocaleString()}
                    </p>
                </div>

                {/* Footer */}
                <div className="text-center pt-8 border-t border-gray-100">
                    <p className="text-gray-400 text-xs uppercase font-bold tracking-widest mb-4">Thank you for investing in your future</p>

                    <Button
                        onClick={() => window.print()}
                        className="print:hidden bg-primary text-white hover:bg-primary/90 rounded-full px-8 font-bold"
                    >
                        <Printer className="h-4 w-4 mr-2" />
                        Print Receipt
                    </Button>
                </div>
            </div>
        </div>
    );
}
