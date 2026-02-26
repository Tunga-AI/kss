'use client';
import { useMemo, useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useFirestore, useCollection, useUser } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import type { Transaction } from '@/lib/transactions-types';
import type { Program } from '@/lib/program-types';
import { format } from 'date-fns';
import {
  Search, RefreshCw, Calendar,
  ChevronDown, Receipt, FileText, Wallet, AlertCircle, CheckCircle, Eye, Tag
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { calculateProgramFinances, type ProgramFinanceStatus } from '@/lib/finance-utils';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PayBalanceDialog } from '@/components/finance/PayBalanceDialog';

export default function LearnerFinancePage() {
  const { user, loading: userLoading } = useUser();
  const firestore = useFirestore();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Fetch User Transactions
  const transactionsQuery = useMemo(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'transactions'), where('learnerEmail', '==', user.email));
  }, [firestore, user]);

  const { data: allTransactions, loading: transactionsLoading } = useCollection<Transaction>(transactionsQuery as any);

  // Fetch All Programs (to get prices)
  const programsQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'programs'));
  }, [firestore]);

  const { data: allPrograms, loading: programsLoading } = useCollection<Program>(programsQuery as any);

  const loading = userLoading || transactionsLoading || programsLoading;

  // Calculate Finances
  const programFinances = useMemo(() => {
    if (!allTransactions || !allPrograms) return [];
    return calculateProgramFinances(allTransactions, allPrograms);
  }, [allTransactions, allPrograms]);

  // Filtered Finances (Programs)
  const filteredProgramFinances = useMemo(() => {
    return programFinances.filter(pf => {
      const matchesSearch = pf.programName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' ||
        (statusFilter === 'Settled' && pf.status === 'Fully Paid') ||
        (statusFilter === 'Pending' && pf.status === 'Partially Paid') ||
        (statusFilter === pf.status);

      return matchesSearch && matchesStatus;
    });
  }, [programFinances, searchQuery, statusFilter]);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gray-50/50 p-2 md:p-4 font-body">
      <div className="w-full">
        {/* Finance Management Hero */}
        <div className="bg-primary text-white p-6 mb-6 border-b border-primary/10 rounded-tl-3xl rounded-br-3xl rounded-tr-none rounded-bl-none shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-accent/20 rounded-full blur-3xl opacity-20" />
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold mb-2 tracking-tight">Financial Overview</h1>
              <p className="text-white/80 text-lg font-medium">Track your program payments and outstanding balances</p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                className="border-white text-white hover:bg-white hover:text-primary h-12 px-6 rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none font-bold transition-all"
                onClick={() => window.location.reload()}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-white border-primary/10 shadow-sm rounded-tl-2xl rounded-br-2xl rounded-tr-none rounded-bl-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs uppercase font-bold text-primary/40 tracking-widest">Total Invested</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">
                KSH {programFinances.reduce((acc, curr) => acc + curr.totalPaid, 0).toLocaleString()}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white border-primary/10 shadow-sm rounded-tl-2xl rounded-br-2xl rounded-tr-none rounded-bl-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs uppercase font-bold text-primary/40 tracking-widest">Outstanding Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-500">
                KSH {programFinances.reduce((acc, curr) => acc + Math.max(0, curr.balance), 0).toLocaleString()}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white border-primary/10 shadow-sm rounded-tl-2xl rounded-br-2xl rounded-tr-none rounded-bl-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs uppercase font-bold text-primary/40 tracking-widest">Active Programs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{programFinances.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Search & Filters Row */}
        <div className="flex flex-col lg:flex-row gap-6 mb-8 items-end">
          <div className="relative flex-1 group w-full">
            <label className="text-xs font-bold text-primary/40 uppercase tracking-widest ml-1 mb-2 block">Search Programs</label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary/30 group-focus-within:text-primary transition-colors" />
              <Input
                placeholder="Search by program name..."
                className="pl-12 h-14 bg-white border-primary/10 rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none focus:ring-primary focus:border-primary shadow-sm text-base font-medium"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-4 items-end w-full lg:w-auto">
            <DropdownCard
              label="Payment Status"
              value={statusFilter}
              onChange={(val: string) => setStatusFilter(val)}
              options={[
                { value: 'all', label: 'All Status' },
                { value: 'Settled', label: 'Fully Paid' },
                { value: 'Pending', label: 'Partially Paid' },
                { value: 'Overpaid', label: 'Overpaid' }
              ]}
              className="w-full sm:w-56"
            />
          </div>
        </div>

        {/* Programs Table */}
        <div className="w-full bg-white shadow-lg border border-primary/10 overflow-hidden rounded-tl-2xl rounded-br-2xl rounded-tr-none rounded-bl-none">
          <div className="overflow-x-auto">
            <Table className="w-full">
              <TableHeader className="bg-primary/5 border-b border-primary/10">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest">Program</TableHead>
                  <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest">Payment Status</TableHead>
                  <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest text-center">Cost Breakdown</TableHead>
                  <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest text-right">Paid</TableHead>
                  <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest text-right">Balance</TableHead>
                  <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-primary/10">
                {filteredProgramFinances.map((program) => (
                  <TableRow key={program.programName} className="hover:bg-primary/5 transition-colors group border-primary/10">
                    <TableCell className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 flex items-center justify-center rounded-tl-lg rounded-br-lg bg-primary/10 text-primary/40 group-hover:bg-accent group-hover:text-white transition-all">
                          <Tag className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-bold text-primary leading-tight">{program.programName}</p>
                          <p className="text-[10px] text-primary/40 uppercase font-black mt-1">{program.currency}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <Badge variant="outline" className={cn(
                        "text-[9px] px-2 py-0.5 uppercase tracking-wide border-none font-bold text-white",
                        program.status === 'Fully Paid' ? 'bg-green-500' :
                          program.status === 'Partially Paid' ? 'bg-amber-500' :
                            program.status === 'Overpaid' ? 'bg-blue-500' : 'bg-gray-400'
                      )}>
                        {program.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-6 py-4 text-center">
                      <div className="flex flex-col items-center text-xs">
                        {program.admissionFee > 0 && <span className="text-primary/60">Adm: {program.admissionFee.toLocaleString()}</span>}
                        <span className="text-primary/80">Tuition: {program.programFee.toLocaleString()}</span>
                        <span className="font-bold border-t border-primary/20 mt-1 pt-1 text-primary">Total: {program.totalCost.toLocaleString()}</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4 text-right">
                      <span className="font-bold text-primary text-sm">{program.totalPaid.toLocaleString()}</span>
                    </TableCell>
                    <TableCell className="px-6 py-4 text-right">
                      <span className={cn("font-bold text-sm", program.balance > 0 ? "text-red-500" : "text-green-600")}>
                        {program.balance > 0 ? program.balance.toLocaleString() : "0"}
                      </span>
                    </TableCell>
                    <TableCell className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <PayBalanceDialog program={program} maxPayableCurrently={program.balance} />
                        <ProgramStatementDialog program={program} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredProgramFinances.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-20 text-primary/40 font-bold uppercase tracking-widest">
                      No programs found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProgramStatementDialog({ program }: { program: ProgramFinanceStatus }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 hover:bg-primary/10 text-primary">
          <FileText className="h-4 w-4 mr-2" />
          Statement
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl bg-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-primary flex items-center gap-2">
            <Wallet className="h-5 w-5 text-accent" />
            Statements for {program.programName}
          </DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          <div className="mb-6 flex justify-between items-center bg-gray-50 p-4 rounded-lg border border-gray-100">
            <div>
              <p className="text-xs uppercase font-bold text-primary/40 tracking-widest">Total Paid</p>
              <p className="text-lg font-bold text-primary">KSH {program.totalPaid.toLocaleString()}</p>
            </div>
            <div className="text-right">
              <p className="text-xs uppercase font-bold text-primary/40 tracking-widest">Outstanding</p>
              <p className={cn("text-lg font-bold", program.balance > 0 ? "text-red-500" : "text-green-600")}>
                KSH {program.balance.toLocaleString()}
              </p>
            </div>
          </div>

          <div className="max-h-[400px] overflow-y-auto border rounded-md">
            <Table>
              <TableHeader className="bg-gray-50 sticky top-0">
                <TableRow>
                  <TableHead className="text-[10px] uppercase font-bold tracking-widest">Date</TableHead>
                  <TableHead className="text-[10px] uppercase font-bold tracking-widest">Reference</TableHead>
                  <TableHead className="text-[10px] uppercase font-bold tracking-widest">Purpose</TableHead>
                  <TableHead className="text-[10px] uppercase font-bold tracking-widest text-right">Amount</TableHead>
                  <TableHead className="text-[10px] uppercase font-bold tracking-widest text-right">Receipt</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {program.transactions.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell className="font-medium text-xs">
                      {format(tx.date ? tx.date.toDate() : new Date(), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{tx.paystackReference}</TableCell>
                    <TableCell className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                      {tx.paymentType || (program.admissionFee > 0 && tx.amount === program.admissionFee ? 'Admission' : 'Tuition')}
                    </TableCell>
                    <TableCell className="text-right font-bold text-xs">{program.currency} {tx.amount.toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 rounded-full"
                        onClick={() => window.open(`/receipt/${tx.id}`, '_blank')}
                      >
                        <Receipt className="h-3 w-3" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function DropdownCard({ label, value, onChange, options, className }: any) {
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <label className="text-xs font-bold text-primary/40 uppercase tracking-widest ml-1">{label}</label>
      <div className="relative group">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none bg-white border border-primary/10 rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none px-4 py-2 text-sm md:text-base font-bold text-primary focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all cursor-pointer shadow-sm h-14"
        >
          {options.map((opt: any) => (
            <option key={opt.value} value={opt.value} className="font-medium">{opt.label}</option>
          ))}
        </select>
        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
          <ChevronDown className="h-4 w-4 text-primary/30 group-hover:text-primary transition-colors" />
        </div>
      </div>
    </div>
  );
}
