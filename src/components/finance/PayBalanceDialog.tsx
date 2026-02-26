'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import { CreditCard, Loader2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import type { ProgramFinanceStatus } from '@/lib/finance-utils';
import { useUser } from '@/firebase';

interface PayBalanceDialogProps {
    program: ProgramFinanceStatus;
    maxPayableCurrently: number; // Basically the balance
}

export function PayBalanceDialog({ program, maxPayableCurrently }: PayBalanceDialogProps) {
    const [amount, setAmount] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const { toast } = useToast();
    const { user } = useUser();

    const handlePay = async () => {
        if (!amount || isNaN(parseFloat(amount))) {
            toast({
                title: "Invalid Amount",
                description: "Please enter a valid amount to pay.",
                variant: "destructive",
            });
            return;
        }

        const payAmount = parseFloat(amount);

        // Check for overpayment against balance
        if (payAmount > maxPayableCurrently) {
            toast({
                title: "Overpayment Detected",
                description: `You are trying to pay KSH ${payAmount.toLocaleString()}, but your outstanding balance is KSH ${maxPayableCurrently.toLocaleString()}. Please adjust the amount.`,
                variant: "destructive",
            });
            return;
        }

        if (payAmount <= 0) {
            toast({
                title: "Invalid Amount",
                description: "Payment amount must be greater than 0.",
                variant: "destructive",
            });
            return;
        }

        setLoading(true);

        try {
            const response = await fetch('/api/paystack/initialize', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: user?.email,
                    amount: payAmount,
                    metadata: {
                        // These field names must match what /payment/callback reads
                        learnerName: user?.name || user?.displayName || 'Learner',
                        learnerEmail: user?.email || '',
                        program: program.programName,
                        programId: program.programId,
                        userId: user?.id || user?.uid,
                        paymentType: 'Tuition',
                        redirectUrl: '/l/finance',
                    },
                }),
            });

            const data = await response.json();

            if (data.success) {
                window.location.href = data.data.authorization_url;
            } else {
                throw new Error(data.message || 'Payment initialization failed');
            }
        } catch (error: any) {
            console.error('Payment Error:', error);
            toast({
                title: "Payment Error",
                description: error.message || "Something went wrong initializing the payment.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    size="sm"
                    className="h-8 bg-green-600 hover:bg-green-700 text-white font-bold uppercase tracking-wider text-[10px] rounded-tl-lg rounded-br-lg rounded-tr-none rounded-bl-none"
                    disabled={maxPayableCurrently <= 0}
                >
                    <CreditCard className="h-3.5 w-3.5 mr-2" />
                    Pay Balance
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-white" aria-describedby={undefined}>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-primary font-bold text-xl">
                        <CreditCard className="h-6 w-6 text-green-600" />
                        Pay Outstanding Balance
                    </DialogTitle>
                </DialogHeader>

                <div className="py-4">
                    <div className="mb-4 bg-gray-50 p-4 rounded-lg border border-gray-100">
                        <p className="text-sm text-gray-500 mb-1">Paying for:</p>
                        <p className="font-bold text-primary text-lg">{program.programName}</p>
                        <div className="mt-2 flex justify-between items-center text-sm">
                            <span className="text-gray-500">Current Balance:</span>
                            <span className="font-bold text-red-600">KSH {maxPayableCurrently.toLocaleString()}</span>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label htmlFor="amount" className="text-sm font-bold text-gray-700">
                                Enter Amount to Pay (KSH)
                            </label>
                            <Input
                                id="amount"
                                type="number"
                                placeholder={`Max: ${maxPayableCurrently}`}
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="font-mono text-lg"
                                max={maxPayableCurrently}
                            />
                            <p className="text-xs text-gray-400">
                                You can pay the full balance or a partial amount.
                            </p>
                        </div>
                    </div>
                </div>

                <DialogFooter className="sm:justify-start">
                    <Button
                        onClick={handlePay}
                        disabled={loading || !amount}
                        className="w-full bg-green-600 hover:bg-green-700 font-bold"
                    >
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {loading ? 'Processing...' : `Pay KSH ${amount ? parseFloat(amount).toLocaleString() : '0'}`}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
