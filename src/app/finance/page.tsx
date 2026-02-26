'use client';
import { useMemo } from 'react';
import Link from 'next/link';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, orderBy, where } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tag, TrendingUp, TrendingDown, CreditCard, RefreshCw, Target, ArrowRight, CheckCircle, XCircle, Clock, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, AreaChart, Area } from "recharts";
import { format } from 'date-fns';

export default function FinanceDashboardPage() {
  const firestore = useFirestore();

  const transactionsQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'transactions'), orderBy('date', 'desc'));
  }, [firestore]);

  const { data: transactions, loading: transactionsLoading } = useCollection<any>(transactionsQuery as any);

  const stats = useMemo(() => {
    if (!transactions) return {
      totalRevenue: 0,
      successfulTransactions: 0,
      pendingTransactions: 0,
      failedTransactions: 0,
      revenueThisMonth: 0,
      averageTransaction: 0
    };

    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    const successful = transactions.filter((t: any) => t.status === 'Success' || t.status === 'Completed');
    const totalRevenue = successful.reduce((sum: number, t: any) => sum + (t.amount || 0), 0);

    const thisMonthRevenue = successful
      .filter((t: any) => t.date && t.date.toDate && t.date.toDate() > oneMonthAgo)
      .reduce((sum: number, t: any) => sum + (t.amount || 0), 0);

    const avgTransaction = successful.length > 0 ? totalRevenue / successful.length : 0;

    return {
      totalRevenue,
      successfulTransactions: successful.length,
      pendingTransactions: transactions.filter((t: any) => t.status === 'Pending').length,
      failedTransactions: transactions.filter((t: any) => t.status === 'Failed').length,
      revenueThisMonth: thisMonthRevenue,
      averageTransaction: avgTransaction
    };
  }, [transactions]);

  // Generate mock revenue data
  const revenueData = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => ({
      month: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'][i],
      revenue: Math.floor(Math.random() * 500000) + 200000
    }));
  }, []);

  const dailyRevenueData = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => ({
      day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i],
      revenue: Math.floor(Math.random() * 50000) + 20000
    }));
  }, []);

  if (transactionsLoading && !transactions) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gray-50/50 p-2 md:p-4 font-body">
      <div className="w-full">
        {/* Hero Section */}
        <div className="bg-primary text-white p-6 mb-6 border-b border-primary/10 rounded-tl-3xl rounded-br-3xl rounded-tr-none rounded-bl-none shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-accent/20 rounded-full blur-3xl opacity-20" />

          <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Wallet className="h-8 w-8 bg-accent/20 p-1.5 rounded-lg text-accent" />
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Finance Dashboard</h1>
              </div>
              <p className="text-white/80 text-lg font-medium">Track revenue, transactions, and financial metrics</p>
            </div>
            <div className="flex items-center gap-3">

            </div>
          </div>
        </div>

        {/* Stats Cards with Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
          <FinanceStatCard
            title="Total Revenue"
            value={`KES ${(stats.totalRevenue / 1000000).toFixed(2)}M`}
            icon={Tag}
            trend="+23%"
            description="All-time earnings"
            chartData={revenueData}
            chartType="area"
            highlight
          />
          <FinanceStatCard
            title="This Month"
            value={`KES ${(stats.revenueThisMonth / 1000).toFixed(0)}K`}
            icon={TrendingUp}
            trend="+15%"
            description="Current month revenue"
            chartData={dailyRevenueData}
            chartType="bar"
          />
          <FinanceStatCard
            title="Avg Transaction"
            value={`KES ${(stats.averageTransaction / 1000).toFixed(1)}K`}
            icon={CreditCard}
            trend={`${stats.successfulTransactions} txns`}
            description="Average per payment"
            chartData={revenueData.slice(0, 5)}
            chartType="line"
          />
          <FinanceStatCard
            title="Pending"
            value={stats.pendingTransactions}
            icon={Clock}
            trend={`${stats.pendingTransactions}`}
            description="Awaiting confirmation"
            chartData={dailyRevenueData.slice(0, 4)}
            chartType="bar"
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card className="border-primary/10 rounded-tl-3xl rounded-br-3xl shadow-xl">
            <CardHeader>
              <CardTitle className="text-primary flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-accent" />
                Revenue Trend
              </CardTitle>
              <CardDescription>Monthly revenue performance (KES)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueData}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#10b981"
                      fill="url(#colorRevenue)"
                      strokeWidth={3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/10 rounded-tl-3xl rounded-br-3xl shadow-xl">
            <CardHeader>
              <CardTitle className="text-primary flex items-center gap-2">
                <Tag className="h-5 w-5 text-accent" />
                Weekly Breakdown
              </CardTitle>
              <CardDescription>Daily revenue this week (KES)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dailyRevenueData}>
                    <Bar
                      dataKey="revenue"
                      fill="#ff6b35"
                      radius={[8, 8, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Transaction Status Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <Card className="border-green-500/20 rounded-tl-3xl rounded-br-3xl shadow-xl bg-green-50/30">
            <CardHeader>
              <CardTitle className="text-green-700 flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Successful
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-black text-green-700 mb-2">{stats.successfulTransactions}</p>
              <p className="text-sm text-green-600">KES {(stats.totalRevenue / 1000000).toFixed(2)}M earned</p>
            </CardContent>
          </Card>

          <Card className="border-orange-500/20 rounded-tl-3xl rounded-br-3xl shadow-xl bg-orange-50/30">
            <CardHeader>
              <CardTitle className="text-orange-700 flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Pending
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-black text-orange-700 mb-2">{stats.pendingTransactions}</p>
              <p className="text-sm text-orange-600">Awaiting confirmation</p>
            </CardContent>
          </Card>

          <Card className="border-red-500/20 rounded-tl-3xl rounded-br-3xl shadow-xl bg-red-50/30">
            <CardHeader>
              <CardTitle className="text-red-700 flex items-center gap-2">
                <XCircle className="h-5 w-5" />
                Failed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-black text-red-700 mb-2">{stats.failedTransactions}</p>
              <p className="text-sm text-red-600">Unsuccessful payments</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Transactions & Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8">
            <Card className="border-primary/10 rounded-tl-3xl rounded-br-3xl shadow-xl">
              <CardHeader>
                <CardTitle className="text-primary flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-accent" />
                  Recent Transactions
                </CardTitle>
                <CardDescription>Latest payment activities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {transactions && transactions.slice(0, 8).map((transaction: any) => (
                    <div
                      key={transaction.id}
                      className="p-4 border border-primary/10 rounded-tl-xl rounded-br-xl hover:bg-primary/5 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-bold text-primary text-sm">
                              {transaction.learnerName || transaction.learnerEmail || 'Unknown'}
                            </p>
                            <Badge className={cn(
                              "text-xs",
                              transaction.status === 'Success' || transaction.status === 'Completed'
                                ? "bg-green-500/10 text-green-600" :
                                transaction.status === 'Pending'
                                  ? "bg-orange-500/10 text-orange-600" :
                                  "bg-red-500/10 text-red-600"
                            )}>
                              {transaction.status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-primary/60">
                            <span>{transaction.program || 'N/A'}</span>
                            {transaction.date && (
                              <span>
                                {format(transaction.date.toDate(), 'MMM dd, yyyy')}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-primary">
                            KES {(transaction.amount || 0).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {(!transactions || transactions.length === 0) && (
                    <p className="text-center text-primary/40 py-12 text-sm">No transactions yet</p>
                  )}
                </div>
                {transactions && transactions.length > 0 && (
                  <Button
                    asChild
                    className="w-full mt-6 bg-primary hover:bg-accent text-white rounded-tl-xl rounded-br-xl font-bold"
                  >
                    <Link href="/fi/finance">View All Transactions <ArrowRight className="ml-2 h-4 w-4" /></Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-4">
            <Card className="border-primary/10 rounded-tl-3xl rounded-br-3xl shadow-xl h-full">
              <CardHeader>
                <CardTitle className="text-primary flex items-center gap-2">
                  <Target className="h-5 w-5 text-accent" />
                  Quick Actions
                </CardTitle>
                <CardDescription>Financial management</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <QuickLinkButton href="/fi/finance" icon={CreditCard} label="All Transactions" />
                <QuickLinkButton href="/fi/finance" icon={Tag} label="Revenue Reports" />
                <QuickLinkButton href="/fi/finance" icon={TrendingUp} label="Analytics" />
                <QuickLinkButton href="/fi/finance" icon={Clock} label="Pending Payments" badge={stats.pendingTransactions} />
              </CardContent>

              <div className="px-6 pb-6">
                <div className="bg-accent/5 p-4 rounded-tl-xl rounded-br-xl border border-accent/10 mt-4">
                  <p className="text-xs text-primary/60 uppercase font-bold mb-3">Financial Summary</p>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-primary">Success Rate</span>
                      <span className="font-bold text-green-600">
                        {transactions && transactions.length > 0
                          ? Math.round((stats.successfulTransactions / transactions.length) * 100)
                          : 0}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-primary">Total Txns</span>
                      <span className="font-bold text-primary">{transactions?.length || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-primary">Avg Amount</span>
                      <span className="font-bold text-primary">
                        KES {(stats.averageTransaction / 1000).toFixed(1)}K
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function FinanceStatCard({ title, value, icon: Icon, trend, description, highlight = false, chartData = [], chartType = 'line' }: any) {
  return (
    <div className={cn(
      "p-6 border rounded-tl-2xl rounded-br-2xl shadow-lg transition-all hover:scale-105 cursor-pointer overflow-hidden",
      highlight ? "bg-primary text-white border-primary" : "bg-white text-primary border-primary/10"
    )}>
      <div className="flex justify-between items-start mb-4">
        <Icon className={cn(
          "h-6 w-6",
          highlight ? "text-accent" : "text-accent"
        )} />
        <span className={cn(
          "text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-sm",
          highlight ? "bg-accent text-white" : "bg-green-500/10 text-green-500"
        )}>
          {trend}
        </span>
      </div>

      <h3 className={cn("text-xs font-black uppercase tracking-widest mb-1 opacity-60")}>{title}</h3>
      <p className="text-3xl font-black mb-2 tracking-tighter">{value}</p>
      <p className={cn("text-[9px] font-medium leading-relaxed opacity-40 uppercase tracking-wide mb-3")}>{description}</p>

      {/* Inline mini chart */}
      {chartData && chartData.length > 0 && (
        <div className="h-16 w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'area' ? (
              <AreaChart data={chartData}>
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke={highlight ? "#ffffff" : "#10b981"}
                  fill={highlight ? "#ffffff" : "#10b981"}
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
              </AreaChart>
            ) : chartType === 'bar' ? (
              <BarChart data={chartData}>
                <Bar
                  dataKey="revenue"
                  fill={highlight ? "#ffffff" : "#ff6b35"}
                  radius={[4, 4, 0, 0]}
                  opacity={0.8}
                />
              </BarChart>
            ) : (
              <LineChart data={chartData}>
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke={highlight ? "#ffffff" : "#0066cc"}
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}

function QuickLinkButton({ href, icon: Icon, label, badge }: { href: string, icon: any, label: string, badge?: number }) {
  return (
    <Link href={href}>
      <Button
        variant="ghost"
        className="w-full justify-start h-auto py-3 px-4 hover:bg-primary/5 border border-transparent hover:border-primary/10 rounded-tl-lg rounded-br-lg group transition-all"
      >
        <div className="flex items-center gap-3 w-full">
          <div className="h-10 w-10 flex items-center justify-center bg-primary/5 rounded-lg text-primary group-hover:bg-accent/10 group-hover:text-accent transition-colors">
            <Icon className="h-5 w-5" />
          </div>
          <span className="font-bold text-sm text-primary flex-1 text-left">{label}</span>
          {badge !== undefined && badge > 0 && (
            <Badge className="bg-accent text-white">{badge}</Badge>
          )}
          <ArrowRight className="h-4 w-4 text-primary/40 group-hover:text-accent group-hover:translate-x-1 transition-all" />
        </div>
      </Button>
    </Link>
  )
}
