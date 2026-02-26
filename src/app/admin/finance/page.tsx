'use client';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  RefreshCw, Search, ChevronDown, Receipt, Calendar,
  User as UserIcon, Tag, Users, Eye,
  Wallet, CheckCircle, AlertCircle,
  TrendingUp, TrendingDown, BarChart3,
  Activity, ArrowUpRight, ArrowDownRight, Layers,
  PieChart, CreditCard, Clock, Plus, Trash2, Pencil,
  FileSpreadsheet, ShoppingCart, Scale
} from "lucide-react";
import { useUsersFirestore, useCollection, useUser } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import type { Transaction } from '@/lib/transactions-types';
import type { Program } from '@/lib/program-types';
import type { Learner } from '@/lib/learners-types';
import type { Expense } from '@/lib/expense-types';
import { EXPENSE_CATEGORIES, PAYMENT_METHODS } from '@/lib/expense-types';
import { addExpense, deleteExpense, updateExpense } from '@/lib/expenses';
import { format, startOfMonth, subMonths, isAfter } from 'date-fns';
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { calculateProgramFinances, type ProgramFinanceStatus, parsePrice } from '@/lib/finance-utils';
import { useToast } from '@/hooks/use-toast';
import {
  Area, AreaChart, Bar, BarChart, ResponsiveContainer,
  XAxis, YAxis, CartesianGrid, Tooltip, Cell, Pie, PieChart as RechartsPieChart, Legend
} from 'recharts';

type CustomerSummary = {
  learnerId?: string;
  learnerEmail: string;
  learnerName: string;
  totalSpend: number;
  transactionCount: number;
  successCount: number;
  programs: string[];
  lastPaymentDate: Date | null;
  transactions: Transaction[];
  financialDetails: ProgramFinanceStatus[];
};

// ─── colour palette ──────────────────────────────────────────────────────────
const CHART_COLORS = ['#0066cc', '#ff6b35', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444'];

export default function FinancePage() {
  const router = useRouter();
  const firestore = useUsersFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'transactions' | 'customers' | 'expenses' | 'pl'>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [programFilter, setProgramFilter] = useState('all');

  // Expense form state
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [expenseForm, setExpenseForm] = useState({
    category: EXPENSE_CATEGORIES[0],
    description: '',
    amount: '',
    payee: '',
    paymentMethod: PAYMENT_METHODS[0],
    referenceNumber: '',
    programName: '',
    notes: '',
    date: format(new Date(), 'yyyy-MM-dd'),
  });
  const [expenseSaving, setExpenseSaving] = useState(false);
  const [expenseCategoryFilter, setExpenseCategoryFilter] = useState('all');
  const [expenseMonthFilter, setExpenseMonthFilter] = useState('all');

  // ── Data fetching ──────────────────────────────────────────────────────────
  const transactionsQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'transactions'), orderBy('date', 'desc'));
  }, [firestore]);
  const { data: allTransactions, loading: loadingTransactions } = useCollection<Transaction>(transactionsQuery as any);

  const programsQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'programs'));
  }, [firestore]);
  const { data: allPrograms, loading: loadingPrograms } = useCollection<Program>(programsQuery as any);

  const learnersQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'learners'));
  }, [firestore]);
  const { data: allLearners, loading: loadingLearners } = useCollection<Learner>(learnersQuery as any);

  // ── Expenses ───────────────────────────────────────────────────────────────
  const expensesQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'expenses'), orderBy('date', 'desc'));
  }, [firestore]);
  const { data: allExpenses, loading: loadingExpenses } = useCollection<Expense>(expensesQuery as any);

  const loading = loadingTransactions || loadingPrograms || loadingLearners || loadingExpenses;

  // ── Derived lists ──────────────────────────────────────────────────────────
  const successTxs = useMemo(() =>
    (allTransactions || []).filter(tx => tx.status === 'Success'),
    [allTransactions]);

  const uniquePrograms = useMemo(() => {
    if (!allTransactions) return [];
    const set = new Set(allTransactions.map(tx => tx.program).filter(Boolean));
    return Array.from(set).sort();
  }, [allTransactions]);

  // ── Customer summaries ─────────────────────────────────────────────────────
  const customerSummaries = useMemo((): CustomerSummary[] => {
    if (!allTransactions || !allPrograms) return [];
    const map = new Map<string, CustomerSummary>();
    allTransactions.forEach(tx => {
      const key = tx.learnerEmail;
      if (!map.has(key)) {
        const learner = allLearners?.find(l => l.email === tx.learnerEmail);
        map.set(key, {
          learnerId: learner?.id,
          learnerEmail: tx.learnerEmail,
          learnerName: tx.learnerName,
          totalSpend: 0,
          transactionCount: 0,
          successCount: 0,
          programs: [],
          lastPaymentDate: null,
          transactions: [],
          financialDetails: []
        });
      }
      const entry = map.get(key)!;
      if (!entry.learnerId && allLearners) {
        const learner = allLearners.find(l => l.email === tx.learnerEmail);
        if (learner) entry.learnerId = learner.id;
      }
      entry.transactionCount += 1;
      entry.transactions.push(tx);
      if (tx.status === 'Success') { entry.totalSpend += tx.amount; entry.successCount += 1; }
      if (tx.program && !entry.programs.includes(tx.program)) entry.programs.push(tx.program);
      if (tx.date) {
        const d = tx.date.toDate();
        if (!entry.lastPaymentDate || d > entry.lastPaymentDate) entry.lastPaymentDate = d;
      }
    });
    return Array.from(map.values())
      .map(c => ({ ...c, financialDetails: calculateProgramFinances(c.transactions, allPrograms) }))
      .sort((a, b) => b.totalSpend - a.totalSpend);
  }, [allTransactions, allPrograms, allLearners]);

  // ── KPI metrics ────────────────────────────────────────────────────────────
  const kpi = useMemo(() => {
    const totalRevenue = successTxs.reduce((s, t) => s + t.amount, 0);
    const totalTxCount = (allTransactions || []).length;
    const successCount = successTxs.length;
    const failedCount = (allTransactions || []).filter(t => t.status === 'Failed').length;
    const pendingCount = (allTransactions || []).filter(t => t.status === 'Pending').length;
    const uniquePayerCount = new Set(successTxs.map(t => t.learnerEmail)).size;

    // 30-day window
    const now = new Date();
    const ago30 = subMonths(now, 1);
    const recentTxs = successTxs.filter(tx => tx.date && isAfter(tx.date.toDate(), ago30));
    const recentRevenue = recentTxs.reduce((s, t) => s + t.amount, 0);

    // Outstanding balance across all customers
    const totalOutstanding = customerSummaries.reduce((s, c) => {
      return s + c.financialDetails.reduce((ss, d) => ss + Math.max(0, d.balance), 0);
    }, 0);

    // Total program cost (what should have been collected)
    const totalExpected = customerSummaries.reduce((s, c) => {
      return s + c.financialDetails.reduce((ss, d) => ss + d.totalCost, 0);
    }, 0);

    const collectionRate = totalExpected > 0 ? Math.round((totalRevenue / totalExpected) * 100) : 0;

    return {
      totalRevenue, totalTxCount, successCount, failedCount, pendingCount,
      uniquePayerCount, recentRevenue, totalOutstanding, collectionRate
    };
  }, [successTxs, allTransactions, customerSummaries]);

  // ── Expense KPIs ──────────────────────────────────────────────────────────
  const expenseKpi = useMemo(() => {
    const expenses = allExpenses || [];
    const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
    const now = new Date();
    const ago30 = subMonths(now, 1);
    const recentExp = expenses
      .filter(e => e.date && isAfter((e.date as any).toDate?.() ?? new Date(e.date as any), ago30))
      .reduce((s, e) => s + e.amount, 0);

    // By category totals
    const byCategory = expenses.reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + e.amount;
      return acc;
    }, {} as Record<string, number>);

    const netProfit = kpi.totalRevenue - totalExpenses;
    const profitMargin = kpi.totalRevenue > 0 ? Math.round((netProfit / kpi.totalRevenue) * 100) : 0;

    return { totalExpenses, recentExp, byCategory, netProfit, profitMargin };
  }, [allExpenses, kpi.totalRevenue]);

  // ── Monthly expenses (last 6 months) ─────────────────────────────────────
  const monthlyExpenses = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const monthStart = startOfMonth(subMonths(new Date(), 5 - i));
      const monthEnd = startOfMonth(subMonths(new Date(), 4 - i));
      const exp = (allExpenses || [])
        .filter(e => {
          if (!e.date) return false;
          const d = (e.date as any).toDate?.() ?? new Date(e.date as any);
          return d >= monthStart && d < monthEnd;
        })
        .reduce((s, e) => s + e.amount, 0);
      return { month: format(monthStart, 'MMM yy'), expenses: exp };
    });
  }, [allExpenses]);



  // ── Filtered expenses ─────────────────────────────────────────────────────
  const filteredExpenses = useMemo(() => {
    return (allExpenses || []).filter(e => {
      const matchesCategory = expenseCategoryFilter === 'all' || e.category === expenseCategoryFilter;
      if (expenseMonthFilter === 'all') return matchesCategory;
      const d = (e.date as any).toDate?.() ?? new Date(e.date as any);
      const monthStr = format(d, 'yyyy-MM');
      return matchesCategory && monthStr === expenseMonthFilter;
    });
  }, [allExpenses, expenseCategoryFilter, expenseMonthFilter]);

  // ── Expense expense months for dropdown ──────────────────────────────────
  const expenseMonths = useMemo(() => {
    const set = new Set<string>();
    (allExpenses || []).forEach(e => {
      if (e.date) {
        const d = (e.date as any).toDate?.() ?? new Date(e.date as any);
        set.add(format(d, 'yyyy-MM'));
      }
    });
    return Array.from(set).sort().reverse();
  }, [allExpenses]);

  // ── Expense CRUD helpers ──────────────────────────────────────────────────
  const resetExpenseForm = () => {
    setExpenseForm({
      category: EXPENSE_CATEGORIES[0],
      description: '',
      amount: '',
      payee: '',
      paymentMethod: PAYMENT_METHODS[0],
      referenceNumber: '',
      programName: '',
      notes: '',
      date: format(new Date(), 'yyyy-MM-dd'),
    });
    setEditingExpense(null);
  };

  const openAddExpense = () => { resetExpenseForm(); setExpenseDialogOpen(true); };
  const openEditExpense = (e: Expense) => {
    const d = (e.date as any).toDate?.() ?? new Date(e.date as any);
    setExpenseForm({
      category: e.category,
      description: e.description,
      amount: String(e.amount),
      payee: e.payee,
      paymentMethod: e.paymentMethod,
      referenceNumber: e.referenceNumber || '',
      programName: e.programName || '',
      notes: e.notes || '',
      date: format(d, 'yyyy-MM-dd'),
    });
    setEditingExpense(e);
    setExpenseDialogOpen(true);
  };

  const handleSaveExpense = async () => {
    if (!firestore || !expenseForm.description || !expenseForm.amount || !expenseForm.payee) {
      toast({ variant: 'destructive', title: 'Missing Fields', description: 'Please fill Description, Amount and Payee.' });
      return;
    }
    setExpenseSaving(true);
    try {
      const payload = {
        category: expenseForm.category,
        description: expenseForm.description,
        amount: parseFloat(expenseForm.amount),
        payee: expenseForm.payee,
        paymentMethod: expenseForm.paymentMethod,
        referenceNumber: expenseForm.referenceNumber || undefined,
        programName: expenseForm.programName || undefined,
        notes: expenseForm.notes || undefined,
        createdBy: user?.email || 'admin',
        date: new Date(expenseForm.date),
      };
      if (editingExpense) {
        await updateExpense(firestore, editingExpense.id, payload as any);
        toast({ title: 'Expense Updated' });
      } else {
        await addExpense(firestore, payload as any);
        toast({ title: 'Expense Recorded' });
      }
      setExpenseDialogOpen(false);
      resetExpenseForm();
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Error', description: err.message });
    } finally {
      setExpenseSaving(false);
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (!firestore) return;
    if (!confirm('Delete this expense record? This cannot be undone.')) return;
    await deleteExpense(firestore, id);
    toast({ title: 'Expense Deleted' });
  };

  // ── Monthly revenue (last 6 months) ───────────────────────────────────────
  const monthlyRevenue = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const monthStart = startOfMonth(subMonths(new Date(), 5 - i));
      const monthEnd = startOfMonth(subMonths(new Date(), 4 - i));
      const rev = successTxs
        .filter(tx => {
          if (!tx.date) return false;
          const d = tx.date.toDate();
          return d >= monthStart && d < monthEnd;
        })
        .reduce((s, t) => s + t.amount, 0);
      return {
        month: format(monthStart, 'MMM yy'),
        revenue: rev,
        transactions: successTxs.filter(tx => {
          if (!tx.date) return false;
          const d = tx.date.toDate();
          return d >= monthStart && d < monthEnd;
        }).length
      };
    });
  }, [successTxs]);

  // ── Revenue by program (top 6) ─────────────────────────────────────────────
  const revenueByProgram = useMemo(() => {
    const map = new Map<string, number>();
    successTxs.forEach(tx => {
      if (!tx.program) return;
      map.set(tx.program, (map.get(tx.program) || 0) + tx.amount);
    });
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, revenue]) => ({
        name: name.length > 22 ? name.substring(0, 20) + '…' : name,
        fullName: name,
        revenue
      }));
  }, [successTxs]);

  // ── Combined monthly P&L ─────────────────────────────────────────────────
  const monthlyPL = useMemo(() => {
    return monthlyRevenue.map((r, i) => ({
      month: r.month,
      revenue: r.revenue,
      expenses: monthlyExpenses[i]?.expenses ?? 0,
      profit: r.revenue - (monthlyExpenses[i]?.expenses ?? 0),
    }));
  }, [monthlyRevenue, monthlyExpenses]);

  // ── Payment status breakdown (for pie) ────────────────────────────────────
  const paymentStatusData = useMemo(() => {
    const paid = customerSummaries.flatMap(c => c.financialDetails).filter(d => d.status === 'Fully Paid').length;
    const partial = customerSummaries.flatMap(c => c.financialDetails).filter(d => d.status === 'Partially Paid').length;
    const none = customerSummaries.flatMap(c => c.financialDetails).filter(d => d.status === 'No Payment').length;
    const over = customerSummaries.flatMap(c => c.financialDetails).filter(d => d.status === 'Overpaid').length;
    return [
      { name: 'Fully Paid', value: paid, color: '#10b981' },
      { name: 'Partial', value: partial, color: '#f59e0b' },
      { name: 'Unpaid', value: none, color: '#ef4444' },
      { name: 'Overpaid', value: over, color: '#8b5cf6' },
    ].filter(d => d.value > 0);
  }, [customerSummaries]);

  // ── Admission vs tuition split ────────────────────────────────────────────
  const paymentTypeSplit = useMemo(() => {
    const admissionTotal = successTxs.filter(t => String(t.paymentType ?? '').toLowerCase() === 'admission').reduce((s, t) => s + t.amount, 0);
    const tuitionTotal = successTxs.filter(t => !t.paymentType || String(t.paymentType).toLowerCase() === 'tuition').reduce((s, t) => s + t.amount, 0);
    return [
      { name: 'Tuition', value: tuitionTotal, color: '#0066cc' },
      { name: 'Admission Fees', value: admissionTotal, color: '#ff6b35' },
    ];
  }, [successTxs]);

  // ── Top debtors ───────────────────────────────────────────────────────────
  const topDebtors = useMemo(() =>
    customerSummaries
      .map(c => ({
        ...c,
        outstanding: c.financialDetails.reduce((s, d) => s + Math.max(0, d.balance), 0)
      }))
      .filter(c => c.outstanding > 0)
      .sort((a, b) => b.outstanding - a.outstanding)
      .slice(0, 5),
    [customerSummaries]);

  // ── Filtered transactions / customers ─────────────────────────────────────
  const filteredTransactions = useMemo(() => {
    if (!allTransactions) return [];
    return allTransactions.filter(tx => {
      const matchesSearch =
        tx.learnerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.program.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (tx.paystackReference && tx.paystackReference.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesStatus = statusFilter === 'all' || tx.status === statusFilter;
      const matchesProgram = programFilter === 'all' || tx.program === programFilter;
      return matchesSearch && matchesStatus && matchesProgram;
    });
  }, [allTransactions, searchQuery, statusFilter, programFilter]);

  const filteredCustomers = useMemo(() =>
    customerSummaries.filter(c => {
      const matchesSearch =
        c.learnerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.learnerEmail.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesProgram = programFilter === 'all' || c.programs.includes(programFilter);
      return matchesSearch && matchesProgram;
    }),
    [customerSummaries, searchQuery, programFilter]);

  const totalRevenue = kpi.totalRevenue;

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

        {/* ── Hero ─────────────────────────────────────────────────────────── */}
        <div className="bg-primary text-white p-6 mb-6 border-b border-primary/10 rounded-tl-3xl rounded-br-3xl rounded-tr-none rounded-bl-none shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-accent/20 rounded-full blur-3xl opacity-20" />
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Tag className="h-8 w-8 bg-accent/20 p-1.5 rounded-lg text-accent" />
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Ledger &amp; Revenue</h1>
              </div>
              <p className="text-white/80 text-lg font-medium">Global financial audits, analytics &amp; transaction monitoring</p>
            </div>
            <div className="flex gap-4 flex-wrap justify-center">
              <div className="bg-white/10 px-6 py-3 rounded-tl-xl rounded-br-xl backdrop-blur-sm border border-white/10">
                <p className="text-2xl font-bold">KES {(totalRevenue / 1000).toFixed(0)}K</p>
                <p className="text-[10px] uppercase font-black tracking-widest text-white/60">Total Revenue</p>
              </div>
              <div className="bg-white/10 px-6 py-3 rounded-tl-xl rounded-br-xl backdrop-blur-sm border border-white/10">
                <p className="text-2xl font-bold">{kpi.collectionRate}%</p>
                <p className="text-[10px] uppercase font-black tracking-widest text-white/60">Collection Rate</p>
              </div>
              <div className="bg-white/10 px-6 py-3 rounded-tl-xl rounded-br-xl backdrop-blur-sm border border-white/10">
                <p className="text-2xl font-bold">{customerSummaries.length}</p>
                <p className="text-[10px] uppercase font-black tracking-widest text-white/60">Payers</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Tabs ─────────────────────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-1 mb-6 bg-white border border-primary/10 rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none p-1 shadow-sm">
          {([
            { key: 'dashboard', icon: BarChart3, label: 'Dashboard' },
            { key: 'customers', icon: Users, label: 'Customers' },
            { key: 'transactions', icon: Receipt, label: 'Income' },
            { key: 'expenses', icon: ShoppingCart, label: 'Expenses' },
            { key: 'pl', icon: Scale, label: 'P&L' },
          ] as const).map(({ key, icon: Icon, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={cn(
                "px-5 py-2.5 text-[11px] font-black uppercase tracking-widest rounded-tl-lg rounded-br-lg rounded-tr-none rounded-bl-none transition-all",
                activeTab === key ? 'bg-primary text-white shadow-md' : 'text-primary/40 hover:text-primary hover:bg-primary/5'
              )}
            >
              <Icon className="h-3.5 w-3.5 inline mr-2 -mt-0.5" />
              {label}
            </button>
          ))}
        </div>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* DASHBOARD TAB                                                      */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">

            {/* KPI Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <KpiCard
                title="Gross Revenue"
                value={`KES ${(kpi.totalRevenue / 1000).toFixed(1)}K`}
                sub={`${kpi.successCount} successful payments`}
                icon={Tag}
                color="blue"
                trend={kpi.recentRevenue > 0 ? `+${((kpi.recentRevenue / Math.max(kpi.totalRevenue, 1)) * 100).toFixed(0)}% this month` : undefined}
              />
              <KpiCard
                title="Total Expenses"
                value={`KES ${(expenseKpi.totalExpenses / 1000).toFixed(1)}K`}
                sub={`${(allExpenses || []).length} expense entries`}
                icon={ShoppingCart}
                color="red"
              />
              <KpiCard
                title="Net Profit"
                value={`KES ${(expenseKpi.netProfit / 1000).toFixed(1)}K`}
                sub={`${expenseKpi.profitMargin}% profit margin`}
                icon={expenseKpi.netProfit >= 0 ? TrendingUp : TrendingDown}
                color={expenseKpi.netProfit >= 0 ? 'green' : 'red'}
                highlight={expenseKpi.netProfit > 0}
              />
              <KpiCard
                title="Outstanding Debt"
                value={`KES ${(kpi.totalOutstanding / 1000).toFixed(1)}K`}
                sub={`${topDebtors.length} payers with balance due`}
                icon={AlertCircle}
                color="purple"
              />
            </div>

            {/* Secondary KPI row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <MiniStatCard title="Total Transactions" value={kpi.totalTxCount} icon={Activity} />
              <MiniStatCard title="Successful" value={kpi.successCount} icon={CheckCircle} color="green" />
              <MiniStatCard title="Failed / Declined" value={kpi.failedCount} icon={AlertCircle} color="red" />
              <MiniStatCard title="Revenue (30 days)" value={`KES ${(kpi.recentRevenue / 1000).toFixed(1)}K`} icon={Clock} color="blue" />
            </div>

            {/* Charts row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* Monthly Revenue Area */}
              <Card className="lg:col-span-2 border-primary/10 rounded-tl-3xl rounded-br-3xl shadow-xl">
                <CardHeader>
                  <CardTitle className="text-primary flex items-center gap-2 text-base">
                    <TrendingUp className="h-5 w-5 text-accent" />
                    Monthly Revenue Trend
                  </CardTitle>
                  <CardDescription>Last 6 months — verified payments only</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[260px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={monthlyRevenue} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                        <defs>
                          <linearGradient id="cgRevenue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#0066cc" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#0066cc" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                        <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false}
                          tickFormatter={v => `${(v / 1000).toFixed(0)}K`} />
                        <Tooltip
                          formatter={(v: any) => [`KES ${Number(v).toLocaleString()}`, 'Revenue']}
                          contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }}
                        />
                        <Area type="monotone" dataKey="revenue" stroke="#0066cc" strokeWidth={2.5} fill="url(#cgRevenue)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Status Donut */}
              <Card className="border-primary/10 rounded-tl-3xl rounded-br-3xl shadow-xl">
                <CardHeader>
                  <CardTitle className="text-primary flex items-center gap-2 text-base">
                    <PieChart className="h-5 w-5 text-accent" />
                    Payment Status Mix
                  </CardTitle>
                  <CardDescription>Across all enrolled programs</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie data={paymentStatusData} cx="50%" cy="50%" innerRadius={55} outerRadius={90}
                          paddingAngle={3} dataKey="value">
                          {paymentStatusData.map((entry, i) => (
                            <Cell key={i} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v: any, n: any) => [v, n]} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {paymentStatusData.map((d, i) => (
                      <div key={i} className="flex items-center gap-2 text-[10px] font-bold text-primary/60 uppercase tracking-wide">
                        <div className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ background: d.color }} />
                        {d.name} ({d.value})
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts row 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* Revenue by Program bar */}
              <Card className="lg:col-span-2 border-primary/10 rounded-tl-3xl rounded-br-3xl shadow-xl">
                <CardHeader>
                  <CardTitle className="text-primary flex items-center gap-2 text-base">
                    <Layers className="h-5 w-5 text-accent" />
                    Revenue by Program
                  </CardTitle>
                  <CardDescription>Top 6 programs by verified revenue</CardDescription>
                </CardHeader>
                <CardContent>
                  {revenueByProgram.length === 0 ? (
                    <div className="h-[220px] flex items-center justify-center text-primary/30 text-sm">No data yet</div>
                  ) : (
                    <div className="h-[220px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={revenueByProgram} margin={{ top: 5, right: 10, bottom: 40, left: 0 }} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
                          <XAxis type="number" stroke="#94a3b8" fontSize={10} tickLine={false}
                            tickFormatter={v => `${(v / 1000).toFixed(0)}K`} />
                          <YAxis type="category" dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} width={100} />
                          <Tooltip
                            formatter={(v: any) => [`KES ${Number(v).toLocaleString()}`, 'Revenue']}
                            contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }}
                          />
                          <Bar dataKey="revenue" radius={[0, 6, 6, 0]}>
                            {revenueByProgram.map((_, i) => (
                              <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Admission vs Tuition split */}
              <Card className="border-primary/10 rounded-tl-3xl rounded-br-3xl shadow-xl">
                <CardHeader>
                  <CardTitle className="text-primary flex items-center gap-2 text-base">
                    <CreditCard className="h-5 w-5 text-accent" />
                    Revenue Split
                  </CardTitle>
                  <CardDescription>Tuition vs Admission fees</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  {paymentTypeSplit.map((t, i) => {
                    const pct = kpi.totalRevenue > 0
                      ? Math.round((t.value / kpi.totalRevenue) * 100) : 0;
                    return (
                      <div key={i} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-full" style={{ background: t.color }} />
                            <span className="text-xs font-bold text-primary">{t.name}</span>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-black text-primary">KES {t.value.toLocaleString()}</p>
                            <p className="text-[10px] text-primary/40">{pct}%</p>
                          </div>
                        </div>
                        <div className="h-2 w-full bg-primary/5 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${pct}%`, background: t.color }} />
                        </div>
                      </div>
                    );
                  })}

                  <div className="pt-4 border-t border-primary/10">
                    <p className="text-[10px] uppercase font-black text-primary/40 tracking-widest mb-3">Outstanding Debt by Status</p>
                    {['Partially Paid', 'No Payment'].map(status => {
                      const items = customerSummaries.flatMap(c => c.financialDetails).filter(d => d.status === status);
                      const total = items.reduce((s, d) => s + Math.max(0, d.balance), 0);
                      return (
                        <div key={status} className="flex justify-between items-center py-1.5 border-b border-primary/5 last:border-0">
                          <span className="text-[11px] font-bold text-primary/70">{status}</span>
                          <span className="text-[11px] font-black text-red-500">KES {total.toLocaleString()}</span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Bottom row: top debtors + top payers */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top debtors */}
              <Card className="border-primary/10 rounded-tl-3xl rounded-br-3xl shadow-xl">
                <CardHeader>
                  <CardTitle className="text-primary flex items-center gap-2 text-base">
                    <ArrowDownRight className="h-5 w-5 text-red-500" />
                    Highest Outstanding Balances
                  </CardTitle>
                  <CardDescription>Learners with largest unpaid amounts</CardDescription>
                </CardHeader>
                <CardContent>
                  {topDebtors.length === 0 ? (
                    <div className="text-center py-8 text-primary/30 text-sm">All accounts settled 🎉</div>
                  ) : (
                    <div className="space-y-3">
                      {topDebtors.map((c, i) => (
                        <div key={c.learnerEmail} className="flex items-center gap-3 p-3 rounded-tl-xl rounded-br-xl border border-red-100 hover:bg-red-50/50 transition-all group cursor-pointer"
                          onClick={() => c.learnerId && router.push(`/admin/finance/${c.learnerId}`)}>
                          <div className="h-9 w-9 flex-shrink-0 flex items-center justify-center rounded-tl-lg rounded-br-lg bg-red-100 text-red-600 font-black text-sm">
                            {c.learnerName.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-primary truncate">{c.learnerName}</p>
                            <p className="text-[10px] text-primary/40 truncate">{c.learnerEmail}</p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-sm font-black text-red-600">KES {c.outstanding.toLocaleString()}</p>
                            <p className="text-[9px] text-primary/30 uppercase tracking-wide">{c.programs.length} program{c.programs.length !== 1 ? 's' : ''}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Top payers */}
              <Card className="border-primary/10 rounded-tl-3xl rounded-br-3xl shadow-xl">
                <CardHeader>
                  <CardTitle className="text-primary flex items-center gap-2 text-base">
                    <ArrowUpRight className="h-5 w-5 text-green-500" />
                    Top Revenue Contributors
                  </CardTitle>
                  <CardDescription>Learners who have paid the most</CardDescription>
                </CardHeader>
                <CardContent>
                  {customerSummaries.slice(0, 5).length === 0 ? (
                    <div className="text-center py-8 text-primary/30 text-sm">No payments recorded yet</div>
                  ) : (
                    <div className="space-y-3">
                      {customerSummaries.slice(0, 5).map((c, i) => (
                        <div key={c.learnerEmail} className="flex items-center gap-3 p-3 rounded-tl-xl rounded-br-xl border border-green-100 hover:bg-green-50/50 transition-all group cursor-pointer"
                          onClick={() => c.learnerId && router.push(`/admin/finance/${c.learnerId}`)}>
                          <div className="flex-shrink-0 h-7 w-7 flex items-center justify-center">
                            <span className="text-[10px] font-black text-primary/30 uppercase tracking-widest">#{i + 1}</span>
                          </div>
                          <div className="h-9 w-9 flex-shrink-0 flex items-center justify-center rounded-tl-lg rounded-br-lg bg-green-100 text-green-700 font-black text-sm">
                            {c.learnerName.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-primary truncate">{c.learnerName}</p>
                            <p className="text-[10px] text-primary/40 truncate">{c.programs.length} program{c.programs.length !== 1 ? 's' : ''}</p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-sm font-black text-green-600">KES {c.totalSpend.toLocaleString()}</p>
                            <p className="text-[9px] text-primary/30 uppercase tracking-wide">{c.successCount} txn{c.successCount !== 1 ? 's' : ''}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* EXPENSES TAB                                                        */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'expenses' && (
          <div className="space-y-6">
            {/* Controls row */}
            <div className="flex flex-col lg:flex-row gap-4 items-end justify-between">
              <div className="flex flex-wrap gap-3 items-end flex-1">
                <DropdownCard
                  label="Category"
                  value={expenseCategoryFilter}
                  onChange={setExpenseCategoryFilter}
                  options={[
                    { value: 'all', label: 'All Categories' },
                    ...EXPENSE_CATEGORIES.map(c => ({ value: c, label: c }))
                  ]}
                  className="w-60"
                />
                <DropdownCard
                  label="Month"
                  value={expenseMonthFilter}
                  onChange={setExpenseMonthFilter}
                  options={[
                    { value: 'all', label: 'All Time' },
                    ...expenseMonths.map(m => ({ value: m, label: format(new Date(m + '-01'), 'MMM yyyy') }))
                  ]}
                  className="w-44"
                />
              </div>
              <Button
                onClick={openAddExpense}
                className="bg-accent hover:bg-accent/90 text-white rounded-tl-xl rounded-br-xl font-bold h-14 px-6"
              >
                <Plus className="h-4 w-4 mr-2" />
                Record Expense
              </Button>
            </div>

            {/* Category summary cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {EXPENSE_CATEGORIES
                .filter(cat => (expenseKpi.byCategory[cat] || 0) > 0)
                .sort((a, b) => (expenseKpi.byCategory[b] || 0) - (expenseKpi.byCategory[a] || 0))
                .slice(0, 8)
                .map(cat => (
                  <button
                    key={cat}
                    onClick={() => setExpenseCategoryFilter(expenseCategoryFilter === cat ? 'all' : cat)}
                    className={cn(
                      "p-4 bg-white border rounded-tl-xl rounded-br-xl text-left transition-all hover:shadow-md",
                      expenseCategoryFilter === cat ? 'border-accent ring-2 ring-accent/20' : 'border-primary/10'
                    )}
                  >
                    <p className="text-[9px] font-black uppercase tracking-widest text-primary/40 truncate">{cat}</p>
                    <p className="text-lg font-black text-primary mt-1">KES {(expenseKpi.byCategory[cat] || 0).toLocaleString()}</p>
                  </button>
                ))}
            </div>

            {/* Expenses table */}
            <div className="w-full bg-white shadow-lg border border-primary/10 overflow-hidden rounded-tl-2xl rounded-br-2xl">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-primary/5 border-b border-primary/10">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="px-5 py-4 font-bold text-primary text-[10px] uppercase tracking-widest">Date</TableHead>
                      <TableHead className="px-5 py-4 font-bold text-primary text-[10px] uppercase tracking-widest">Category</TableHead>
                      <TableHead className="px-5 py-4 font-bold text-primary text-[10px] uppercase tracking-widest">Description / Payee</TableHead>
                      <TableHead className="px-5 py-4 font-bold text-primary text-[10px] uppercase tracking-widest">Program</TableHead>
                      <TableHead className="px-5 py-4 font-bold text-primary text-[10px] uppercase tracking-widest">Method</TableHead>
                      <TableHead className="px-5 py-4 font-bold text-primary text-[10px] uppercase tracking-widest text-right">Amount (KES)</TableHead>
                      <TableHead className="px-5 py-4 font-bold text-primary text-[10px] uppercase tracking-widest text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-primary/10">
                    {filteredExpenses.map(exp => (
                      <TableRow key={exp.id} className="hover:bg-primary/5 transition-colors group">
                        <TableCell className="px-5 py-3 text-xs font-medium text-primary/60">
                          {exp.date ? format((exp.date as any).toDate?.() ?? new Date(exp.date as any), 'dd MMM yyyy') : '—'}
                        </TableCell>
                        <TableCell className="px-5 py-3">
                          <Badge variant="outline" className="text-[8px] px-2 py-0 h-5 font-black uppercase tracking-widest border-primary/20 text-primary/60 rounded-tl-sm rounded-br-sm">
                            {exp.category}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-5 py-3">
                          <p className="font-bold text-sm text-primary leading-tight">{exp.description}</p>
                          <p className="text-[10px] text-primary/40 mt-0.5 uppercase tracking-wide">Paid to: {exp.payee}</p>
                          {exp.referenceNumber && (
                            <p className="text-[9px] text-primary/30 font-mono mt-0.5">Ref: {exp.referenceNumber}</p>
                          )}
                        </TableCell>
                        <TableCell className="px-5 py-3 text-xs text-primary/50">{exp.programName || '—'}</TableCell>
                        <TableCell className="px-5 py-3">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-primary/50">{exp.paymentMethod}</span>
                        </TableCell>
                        <TableCell className="px-5 py-3 text-right">
                          <span className="font-black text-red-600 text-sm">{exp.amount.toLocaleString()}</span>
                        </TableCell>
                        <TableCell className="px-5 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button size="icon" variant="ghost" className="h-7 w-7 hover:bg-primary/10" onClick={() => openEditExpense(exp)}>
                              <Pencil className="h-3 w-3" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7 hover:bg-red-50 text-red-500" onClick={() => handleDeleteExpense(exp.id)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredExpenses.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-16 text-primary/30 font-bold uppercase tracking-widest text-xs">
                          No expense records found. Click "Record Expense" to add one.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              {filteredExpenses.length > 0 && (
                <div className="px-5 py-3 border-t border-primary/10 bg-primary/5 flex justify-between items-center">
                  <span className="text-xs font-bold text-primary/50 uppercase tracking-widest">{filteredExpenses.length} entries</span>
                  <span className="font-black text-red-600">Total: KES {filteredExpenses.reduce((s, e) => s + e.amount, 0).toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* P&L TAB                                                             */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'pl' && (
          <div className="space-y-6">
            {/* P&L KPI row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <KpiCard
                title="Gross Revenue"
                value={`KES ${(kpi.totalRevenue / 1000).toFixed(1)}K`}
                sub="All verified learner payments"
                icon={ArrowUpRight}
                color="blue"
              />
              <KpiCard
                title="Total Operating Expenses"
                value={`KES ${(expenseKpi.totalExpenses / 1000).toFixed(1)}K`}
                sub={`${(allExpenses || []).length} recorded expense entries`}
                icon={ArrowDownRight}
                color="red"
              />
              <KpiCard
                title="Net Profit / (Loss)"
                value={`KES ${(expenseKpi.netProfit / 1000).toFixed(1)}K`}
                sub={`${expenseKpi.profitMargin}% profit margin`}
                icon={expenseKpi.netProfit >= 0 ? TrendingUp : TrendingDown}
                color={expenseKpi.netProfit >= 0 ? 'green' : 'red'}
                highlight={expenseKpi.netProfit > 0}
              />
            </div>

            {/* Waterfall summary */}
            <Card className="border-primary/10 rounded-tl-3xl rounded-br-3xl shadow-xl">
              <CardHeader>
                <CardTitle className="text-primary flex items-center gap-2 text-base">
                  <FileSpreadsheet className="h-5 w-5 text-accent" />
                  Income Statement Summary
                </CardTitle>
                <CardDescription>Simplified P&L — all time to date</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-1 max-w-xl">
                  <PLLine label="Gross Revenue" amount={kpi.totalRevenue} positive />
                  <div className="pl-4 space-y-1 border-l-2 border-primary/10 my-2">
                    {Object.entries(expenseKpi.byCategory)
                      .sort((a, b) => b[1] - a[1])
                      .map(([cat, amt]) => (
                        <PLLine key={cat} label={cat} amount={-amt} indent />
                      ))}
                  </div>
                  <div className="border-t-2 border-primary/20 pt-2">
                    <PLLine label="Net Profit / (Loss)" amount={expenseKpi.netProfit} bold />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Monthly P&L chart */}
            <Card className="border-primary/10 rounded-tl-3xl rounded-br-3xl shadow-xl">
              <CardHeader>
                <CardTitle className="text-primary flex items-center gap-2 text-base">
                  <BarChart3 className="h-5 w-5 text-accent" />
                  Monthly Revenue vs Expenses
                </CardTitle>
                <CardDescription>Last 6 months comparison</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyPL} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false}
                        tickFormatter={v => `${(v / 1000).toFixed(0)}K`} />
                      <Tooltip
                        formatter={(v: any, name: any) => [`KES ${Number(v).toLocaleString()}`, name]}
                        contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }}
                      />
                      <Legend />
                      <Bar dataKey="revenue" name="Revenue" fill="#0066cc" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="expenses" name="Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="profit" name="Net Profit" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Expense breakdown by category */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-primary/10 rounded-tl-3xl rounded-br-3xl shadow-xl">
                <CardHeader>
                  <CardTitle className="text-primary text-base flex items-center gap-2">
                    <PieChart className="h-5 w-5 text-accent" />
                    Expense Breakdown
                  </CardTitle>
                  <CardDescription>By category</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(expenseKpi.byCategory)
                      .sort((a, b) => b[1] - a[1])
                      .map(([cat, amt], i) => {
                        const pct = expenseKpi.totalExpenses > 0
                          ? Math.round((amt / expenseKpi.totalExpenses) * 100) : 0;
                        return (
                          <div key={cat}>
                            <div className="flex justify-between mb-1">
                              <span className="text-xs font-bold text-primary/70">{cat}</span>
                              <span className="text-xs font-black text-red-600">{pct}% · KES {amt.toLocaleString()}</span>
                            </div>
                            <div className="h-1.5 w-full bg-primary/5 rounded-full">
                              <div className="h-full rounded-full bg-red-400 transition-all"
                                style={{ width: `${pct}%`, background: CHART_COLORS[i % CHART_COLORS.length] }} />
                            </div>
                          </div>
                        );
                      })}
                    {Object.keys(expenseKpi.byCategory).length === 0 && (
                      <p className="text-center py-6 text-primary/30 text-sm">No expenses recorded yet</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-primary/10 rounded-tl-3xl rounded-br-3xl shadow-xl">
                <CardHeader>
                  <CardTitle className="text-primary text-base flex items-center gap-2">
                    <Wallet className="h-5 w-5 text-accent" />
                    Outstanding Debtors
                  </CardTitle>
                  <CardDescription>Learners with unpaid balances</CardDescription>
                </CardHeader>
                <CardContent>
                  {topDebtors.length === 0 ? (
                    <div className="text-center py-8 text-primary/30 text-sm">All accounts settled 🎉</div>
                  ) : (
                    <div className="space-y-2">
                      {topDebtors.map(c => (
                        <div key={c.learnerEmail} className="flex items-center gap-3 p-3 rounded-xl border border-red-100">
                          <div className="h-8 w-8 flex-shrink-0 flex items-center justify-center rounded-full bg-red-100 text-red-600 font-black text-sm">
                            {c.learnerName.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-primary truncate">{c.learnerName}</p>
                            <p className="text-[10px] text-primary/40 truncate">{c.learnerEmail}</p>
                          </div>
                          <span className="font-black text-red-600 text-sm">KES {c.outstanding.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* ── Add/Edit Expense Dialog ────────────────────────────────────────── */}
        <Dialog open={expenseDialogOpen} onOpenChange={v => { setExpenseDialogOpen(v); if (!v) resetExpenseForm(); }}>
          <DialogContent className="sm:max-w-lg bg-white" aria-describedby={undefined}>
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-primary flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-accent" />
                {editingExpense ? 'Edit Expense' : 'Record New Expense'}
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1 col-span-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-primary/50">Category *</Label>
                  <select
                    className="w-full border border-primary/20 rounded-tl-lg rounded-br-lg px-3 py-2 text-sm font-medium text-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    value={expenseForm.category}
                    onChange={e => setExpenseForm(f => ({ ...f, category: e.target.value as any }))}
                  >
                    {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="space-y-1 col-span-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-primary/50">Description *</Label>
                  <Input
                    placeholder="e.g. Facilitator fee – March cohort"
                    value={expenseForm.description}
                    onChange={e => setExpenseForm(f => ({ ...f, description: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-bold uppercase tracking-widest text-primary/50">Amount (KES) *</Label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={expenseForm.amount}
                    onChange={e => setExpenseForm(f => ({ ...f, amount: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-bold uppercase tracking-widest text-primary/50">Date *</Label>
                  <Input
                    type="date"
                    value={expenseForm.date}
                    onChange={e => setExpenseForm(f => ({ ...f, date: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-bold uppercase tracking-widest text-primary/50">Payee / Paid To *</Label>
                  <Input
                    placeholder="Name or Company"
                    value={expenseForm.payee}
                    onChange={e => setExpenseForm(f => ({ ...f, payee: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-bold uppercase tracking-widest text-primary/50">Payment Method</Label>
                  <select
                    className="w-full border border-primary/20 rounded-tl-lg rounded-br-lg px-3 py-2 text-sm font-medium text-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    value={expenseForm.paymentMethod}
                    onChange={e => setExpenseForm(f => ({ ...f, paymentMethod: e.target.value as any }))}
                  >
                    {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-bold uppercase tracking-widest text-primary/50">Ref / Invoice No.</Label>
                  <Input
                    placeholder="INV-001 or receipt no."
                    value={expenseForm.referenceNumber}
                    onChange={e => setExpenseForm(f => ({ ...f, referenceNumber: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-bold uppercase tracking-widest text-primary/50">Related Program</Label>
                  <Input
                    placeholder="Optional — tag to a program"
                    value={expenseForm.programName}
                    onChange={e => setExpenseForm(f => ({ ...f, programName: e.target.value }))}
                  />
                </div>
                <div className="space-y-1 col-span-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-primary/50">Notes</Label>
                  <Textarea
                    placeholder="Additional details…"
                    rows={2}
                    value={expenseForm.notes}
                    onChange={e => setExpenseForm(f => ({ ...f, notes: e.target.value }))}
                    className="resize-none"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setExpenseDialogOpen(false)} disabled={expenseSaving}>Cancel</Button>
              <Button onClick={handleSaveExpense} disabled={expenseSaving} className="bg-primary text-white font-bold">
                {expenseSaving ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : null}
                {editingExpense ? 'Save Changes' : 'Record Expense'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* CUSTOMERS + TRANSACTIONS TABS (unchanged UI logic)                 */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {(activeTab === 'customers' || activeTab === 'transactions') && (
          <>
            {/* Filters */}
            <div className="flex flex-col lg:flex-row gap-4 mb-6 items-end">
              <div className="relative flex-1 group w-full">
                <label className="text-xs font-bold text-primary/40 uppercase tracking-widest ml-1 mb-2 block">
                  {activeTab === 'customers' ? 'Search Customers' : 'Search Ledger'}
                </label>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary/30 group-focus-within:text-primary transition-colors" />
                  <Input
                    placeholder={activeTab === 'customers' ? 'Search by name or email...' : 'Search by name, program or reference...'}
                    className="pl-12 h-14 bg-white border-primary/10 rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none focus:ring-primary focus:border-primary shadow-sm text-base font-medium"
                    value={searchQuery}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-4 items-end w-full lg:w-auto">
                <DropdownCard
                  label="Filter by Program"
                  value={programFilter}
                  onChange={setProgramFilter}
                  options={[
                    { value: 'all', label: 'All Programs' },
                    ...uniquePrograms.map(p => ({ value: p, label: p }))
                  ]}
                  className="w-full sm:w-64"
                />
                {activeTab === 'transactions' && (
                  <DropdownCard
                    label="Settlement Status"
                    value={statusFilter}
                    onChange={setStatusFilter}
                    options={[
                      { value: 'all', label: 'All Payments' },
                      { value: 'Success', label: 'Settled' },
                      { value: 'Pending', label: 'Pending' },
                      { value: 'Failed', label: 'Failed/Refunded' }
                    ]}
                    className="w-full sm:w-64"
                  />
                )}
              </div>
            </div>

            {/* Customers Table */}
            {activeTab === 'customers' && (
              <div className="w-full bg-white shadow-lg border border-primary/10 overflow-hidden rounded-tl-2xl rounded-br-2xl rounded-tr-none rounded-bl-none">
                <div className="overflow-x-auto">
                  <Table className="w-full">
                    <TableHeader className="bg-primary/5 border-b border-primary/10">
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest">Customer</TableHead>
                        <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest">Programs Engaged</TableHead>
                        <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest text-center">Transactions</TableHead>
                        <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest text-right">Total Paid (KES)</TableHead>
                        <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="divide-y divide-primary/10">
                      {filteredCustomers.map((customer) => (
                        <TableRow key={customer.learnerEmail} className="hover:bg-primary/5 transition-colors group border-primary/10">
                          <TableCell className="px-6 py-4">
                            <div className="flex items-center gap-4">
                              <div className="h-10 w-10 flex items-center justify-center rounded-tl-lg rounded-br-lg bg-primary/10 text-primary/40 group-hover:bg-accent group-hover:text-white transition-all font-black text-sm">
                                {customer.learnerName.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-bold text-primary leading-tight">{customer.learnerName}</p>
                                <p className="text-[10px] text-primary/40 mt-0.5">{customer.learnerEmail}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="px-6 py-4">
                            <div className="flex flex-wrap gap-1">
                              {customer.financialDetails.slice(0, 2).map(p => (
                                <Badge key={p.programName} variant="outline" className={cn("text-[8px] px-2 py-0 h-5 font-black uppercase text-primary/50 rounded-tl-sm rounded-br-sm rounded-tr-none rounded-bl-none", p.balance > 0 ? "border-red-500/30 text-red-500" : "border-primary/20 bg-primary/5")}>
                                  {p.programName.length > 20 ? p.programName.substring(0, 18) + '…' : p.programName}
                                  {p.balance > 0 && <span className="ml-1 text-[7px] text-red-500">• Due</span>}
                                </Badge>
                              ))}
                              {customer.financialDetails.length > 2 && (
                                <Badge variant="outline" className="text-[8px] px-2 py-0 h-5 font-black uppercase border-accent/30 text-accent rounded-tl-sm rounded-br-sm rounded-tr-none rounded-bl-none">
                                  +{customer.financialDetails.length - 2} more
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="px-6 py-4 text-center">
                            <div className="flex flex-col items-center">
                              <span className="font-bold text-primary text-sm">{customer.successCount}</span>
                              <span className="text-[9px] font-black uppercase tracking-widest text-primary/30">
                                {customer.transactionCount > customer.successCount ? `${customer.transactionCount} total` : 'settled'}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="px-6 py-4 text-right">
                            <span className="font-bold text-primary text-base">{customer.totalSpend.toLocaleString()}</span>
                          </TableCell>
                          <TableCell className="px-6 py-4 text-right">
                            <Button
                              size="sm" variant="ghost"
                              className="text-primary hover:text-accent font-bold text-xs uppercase tracking-wider h-8"
                              onClick={() => { if (customer.learnerId) router.push(`/admin/finance/${customer.learnerId}`); else alert('Learner profile not found.'); }}
                              disabled={!customer.learnerId}
                            >
                              <Eye className="h-4 w-4 mr-2" /> Details
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {filteredCustomers.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-20 text-primary/40 font-bold uppercase tracking-widest">
                            No customers found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {/* Transactions Table */}
            {activeTab === 'transactions' && (
              <div className="w-full bg-white shadow-lg border border-primary/10 overflow-hidden rounded-tl-2xl rounded-br-2xl rounded-tr-none rounded-bl-none">
                <div className="overflow-x-auto">
                  <Table className="w-full">
                    <TableHeader className="bg-primary/5 border-b border-primary/10">
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest w-12">ID</TableHead>
                        <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest">Subscriber Info</TableHead>
                        <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest text-center">Purpose</TableHead>
                        <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest text-center">Amount (KES)</TableHead>
                        <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest text-center">Status</TableHead>
                        <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest">Reference</TableHead>
                        <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest text-right">Date</TableHead>
                        <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest text-right">Receipt</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="divide-y divide-primary/10">
                      {filteredTransactions.map((tx) => (
                        <TableRow key={tx.id} className="hover:bg-primary/5 cursor-pointer transition-colors group border-primary/10">
                          <TableCell className="px-6 py-4 font-black text-primary/30 text-xs text-center">#{tx.id}</TableCell>
                          <TableCell className="px-6 py-4">
                            <div className="flex items-center gap-4">
                              <div className="h-10 w-10 flex items-center justify-center rounded-tl-lg rounded-br-lg bg-primary/10 text-primary/40 group-hover:bg-accent group-hover:text-white transition-all">
                                <UserIcon className="h-5 w-5" />
                              </div>
                              <div>
                                <p className="font-bold text-primary leading-tight">{tx.learnerName}</p>
                                <p className="text-[10px] text-primary/40 uppercase font-black mt-1 line-clamp-1">{tx.program}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="px-6 py-4 text-center">
                            <span className="text-xs font-bold uppercase tracking-widest text-primary/60">
                              {(() => {
                                const prog = allPrograms?.find(p =>
                                  (p.programName || p.title || '').trim().toLowerCase() === tx.program?.trim().toLowerCase()
                                );
                                const admFee = parsePrice(prog?.admissionCost ?? (prog as any)?.registrationFee);
                                return tx.paymentType || (admFee > 0 && tx.amount === admFee ? 'Admission' : 'Tuition');
                              })()}
                            </span>
                          </TableCell>
                          <TableCell className="px-6 py-4 text-center">
                            <span className="font-bold text-primary">{tx.currency} {tx.amount.toLocaleString()}</span>
                          </TableCell>
                          <TableCell className="px-6 py-4 text-center">
                            <Badge className={cn(
                              "rounded-tl-sm rounded-br-sm rounded-tr-none rounded-bl-none font-bold text-[9px] uppercase tracking-widest border-none px-3",
                              tx.status === 'Success' ? 'bg-green-500 text-white' :
                                tx.status === 'Failed' ? 'bg-destructive text-white' :
                                  'bg-accent text-white'
                            )}>
                              {tx.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="px-6 py-4">
                            <div className="flex items-center gap-2 text-xs font-mono text-primary/40">
                              <Receipt className="h-3 w-3 text-accent" />
                              {tx.paystackReference?.substring(0, 12)}...
                            </div>
                          </TableCell>
                          <TableCell className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2 text-xs text-primary/70 font-medium">
                              <Calendar className="h-3 w-3 text-accent" />
                              {tx.date ? format(tx.date.toDate(), 'MMM d, yyyy') : 'N/A'}
                            </div>
                          </TableCell>
                          <TableCell className="px-6 py-4 text-right">
                            <Button
                              variant="ghost" size="sm"
                              className="h-8 rounded-full hover:bg-primary/5 hover:text-primary px-3 text-[10px] uppercase font-bold tracking-widest"
                              onClick={(e) => { e.stopPropagation(); window.open(`/receipt/${tx.id}`, '_blank'); }}
                            >
                              Receipt
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {filteredTransactions.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-20 text-primary/40 font-bold uppercase tracking-widest">
                            No financial records matched the current filters
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ── P&L line helper ───────────────────────────────────────────────────────────
function PLLine({ label, amount, positive, bold, indent }: { label: string; amount: number; positive?: boolean; bold?: boolean; indent?: boolean }) {
  const isNeg = amount < 0;
  return (
    <div className={cn('flex justify-between items-center py-1.5 border-b border-primary/5 last:border-0', indent && 'pl-2')}>
      <span className={cn('text-sm', bold ? 'font-black text-primary' : 'text-primary/70')}>{label}</span>
      <span className={cn('text-sm font-black', bold ? (isNeg ? 'text-red-600' : 'text-green-600') : isNeg ? 'text-red-500' : 'text-green-600')}>
        {isNeg ? `(KES ${Math.abs(amount).toLocaleString()})` : `KES ${amount.toLocaleString()}`}
      </span>
    </div>
  );
}

// ── Helper components ─────────────────────────────────────────────────────────

function KpiCard({ title, value, sub, icon: Icon, color = 'blue', trend, highlight }: any) {
  const colours: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    red: 'bg-red-50 text-red-600 border-red-100',
    green: 'bg-green-50 text-green-600 border-green-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100',
  };
  const iconBg: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-600',
    red: 'bg-red-100 text-red-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
  };
  return (
    <div className={cn(
      "p-6 border rounded-tl-2xl rounded-br-2xl shadow-lg bg-white transition-all hover:-translate-y-0.5 hover:shadow-xl",
      highlight ? 'ring-2 ring-green-500/30' : 'border-primary/10'
    )}>
      <div className="flex items-start justify-between mb-4">
        <div className={cn("h-10 w-10 rounded-tl-lg rounded-br-lg flex items-center justify-center", iconBg[color])}>
          <Icon className="h-5 w-5" />
        </div>
        {trend && (
          <span className="text-[9px] font-black uppercase tracking-wide px-2 py-1 rounded-sm bg-green-500/10 text-green-600">
            {trend}
          </span>
        )}
      </div>
      <p className="text-[10px] font-black uppercase tracking-widest text-primary/40 mb-1">{title}</p>
      <p className="text-3xl font-black text-primary tracking-tight mb-1">{value}</p>
      <p className="text-[10px] text-primary/40 leading-relaxed">{sub}</p>
    </div>
  );
}

function MiniStatCard({ title, value, icon: Icon, color = 'default' }: any) {
  const textColor: Record<string, string> = {
    default: 'text-primary',
    green: 'text-green-600',
    red: 'text-red-600',
    blue: 'text-blue-600',
  };
  return (
    <div className="p-4 bg-white border border-primary/10 rounded-tl-2xl rounded-br-2xl shadow-sm flex items-center gap-4">
      <div className="h-10 w-10 flex items-center justify-center rounded-tl-lg rounded-br-lg bg-primary/5 text-primary/40 flex-shrink-0">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-[9px] font-black uppercase tracking-widest text-primary/40 truncate">{title}</p>
        <p className={cn("text-xl font-black", textColor[color] || textColor.default)}>{value}</p>
      </div>
    </div>
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
