'use client';
import { useMemo } from 'react';
import Link from 'next/link';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, orderBy, where, Timestamp } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, TrendingUp, DollarSign, UserPlus, RefreshCw, Target, ArrowRight, Phone, Mail, CheckCircle, XCircle, Clock } from "lucide-react";
import type { SaleLead } from '@/lib/sales-types';
import { cn } from "@/lib/utils";
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell } from "recharts";

export default function SalesDashboardPage() {
  const firestore = useFirestore();

  const leadsQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'sales_leads'), orderBy('createdAt', 'desc'));
  }, [firestore]);

  const { data: leads, loading: leadsLoading } = useCollection<SaleLead>(leadsQuery as any);

  const stats = useMemo(() => {
    if (!leads) return {
      totalLeads: 0,
      prospects: 0,
      converted: 0,
      lost: 0,
      conversionRate: 0,
      newThisWeek: 0
    };

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const newThisWeek = leads.filter(lead =>
      lead.createdAt && lead.createdAt.toDate() > oneWeekAgo
    ).length;

    const prospects = leads.filter(l => l.status === 'Prospect' || l.status === 'Lead').length;
    const converted = leads.filter(l => l.status === 'Admitted').length;
    const lost = leads.filter(l => l.status === 'Lost').length;

    return {
      totalLeads: leads.length,
      prospects,
      converted,
      lost,
      conversionRate: leads.length > 0 ? Math.round((converted / leads.length) * 100) : 0,
      newThisWeek
    };
  }, [leads]);

  // Generate mock trend data
  const leadsTrendData = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => ({
      day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i],
      leads: Math.floor(Math.random() * 15) + 5
    }));
  }, []);

  const conversionData = useMemo(() => {
    return [
      { name: 'Prospects', value: stats.prospects, color: '#0066cc' },
      { name: 'Converted', value: stats.converted, color: '#10b981' },
      { name: 'Lost', value: stats.lost, color: '#ef4444' }
    ];
  }, [stats]);

  if (leadsLoading && !leads) {
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
                <Target className="h-8 w-8 bg-accent/20 p-1.5 rounded-lg text-accent" />
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Sales Dashboard</h1>
              </div>
              <p className="text-white/80 text-lg font-medium">Track leads, conversions, and sales performance</p>
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

        {/* Stats Cards with Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
          <SalesStatCard
            title="Total Leads"
            value={stats.totalLeads}
            icon={Users}
            trend="+12%"
            description="All-time leads"
            chartData={leadsTrendData}
            chartType="area"
          />
          <SalesStatCard
            title="New This Week"
            value={stats.newThisWeek}
            icon={UserPlus}
            trend={`+${stats.newThisWeek}`}
            description="Last 7 days"
            chartData={leadsTrendData.slice(-4)}
            chartType="bar"
            highlight
          />
          <SalesStatCard
            title="Active Prospects"
            value={stats.prospects}
            icon={Clock}
            trend={`${stats.prospects}`}
            description="In pipeline"
            chartData={leadsTrendData.slice(0, 5)}
            chartType="line"
          />
          <SalesStatCard
            title="Conversion Rate"
            value={`${stats.conversionRate}%`}
            icon={TrendingUp}
            trend="+5%"
            description="Success rate"
            chartData={leadsTrendData}
            chartType="area"
          />
        </div>

        {/* Charts and Leads Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card className="border-primary/10 rounded-tl-3xl rounded-br-3xl shadow-xl">
            <CardHeader>
              <CardTitle className="text-primary flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-accent" />
                Lead Generation Trend
              </CardTitle>
              <CardDescription>Weekly lead acquisition</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={leadsTrendData}>
                    <defs>
                      <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0066cc" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#0066cc" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Area
                      type="monotone"
                      dataKey="leads"
                      stroke="#0066cc"
                      fill="url(#colorLeads)"
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
                <Target className="h-5 w-5 text-accent" />
                Lead Status Distribution
              </CardTitle>
              <CardDescription>Current pipeline breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {conversionData.map((item) => {
                  const percentage = stats.totalLeads > 0 ? Math.round((item.value / stats.totalLeads) * 100) : 0;
                  return (
                    <div key={item.name} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                          <span className="text-sm font-bold text-primary">{item.name}</span>
                        </div>
                        <span className="text-xs text-primary/60">{item.value} ({percentage}%)</span>
                      </div>
                      <div className="w-full bg-primary/5 rounded-full h-2">
                        <div
                          className="h-2 rounded-full transition-all"
                          style={{ width: `${percentage}%`, backgroundColor: item.color }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Leads and Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8">
            <Card className="border-primary/10 rounded-tl-3xl rounded-br-3xl shadow-xl">
              <CardHeader>
                <CardTitle className="text-primary flex items-center gap-2">
                  <Users className="h-5 w-5 text-accent" />
                  Recent Leads
                </CardTitle>
                <CardDescription>Latest prospective students</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {leads && leads.slice(0, 8).map((lead) => (
                    <div key={lead.id} className="p-4 border border-primary/10 rounded-tl-xl rounded-br-xl hover:bg-primary/5 transition-all group">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-bold text-primary text-sm">{lead.name}</p>
                            <Badge className={cn(
                              "text-xs",
                              lead.status === 'Admitted' ? "bg-green-500/10 text-green-600" :
                                lead.status === 'Lost' ? "bg-red-500/10 text-red-600" :
                                  "bg-blue-500/10 text-blue-600"
                            )}>
                              {lead.status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-primary/60">
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {lead.email}
                            </span>
                            {lead.program && (
                              <span className="flex items-center gap-1">
                                <Target className="h-3 w-3" />
                                {lead.program}
                              </span>
                            )}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Phone className="h-4 w-4 mr-1" />
                          Contact
                        </Button>
                      </div>
                    </div>
                  ))}
                  {(!leads || leads.length === 0) && (
                    <p className="text-center text-primary/40 py-12 text-sm">No leads yet</p>
                  )}
                </div>
                {leads && leads.length > 0 && (
                  <Button
                    asChild
                    className="w-full mt-6 bg-primary hover:bg-accent text-white rounded-tl-xl rounded-br-xl font-bold"
                  >
                    <Link href="/s/crm">View All Leads <ArrowRight className="ml-2 h-4 w-4" /></Link>
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
                <CardDescription>Common sales tasks</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <QuickLinkButton href="/s/crm" icon={Users} label="Manage Leads" badge={stats.prospects} />
                <QuickLinkButton href="/s/crm" icon={UserPlus} label="Add New Lead" />
                <QuickLinkButton href="/s/crm" icon={CheckCircle} label="Follow Up" badge={stats.prospects} />
                <QuickLinkButton href="/s/crm" icon={TrendingUp} label="Sales Reports" />
              </CardContent>

              <div className="px-6 pb-6">
                <div className="bg-accent/5 p-4 rounded-tl-xl rounded-br-xl border border-accent/10 mt-4">
                  <p className="text-xs text-primary/60 uppercase font-bold mb-2">Performance Summary</p>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-primary">Converted</span>
                      <span className="font-bold text-green-600">{stats.converted}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-primary">In Progress</span>
                      <span className="font-bold text-blue-600">{stats.prospects}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-primary">Lost</span>
                      <span className="font-bold text-red-600">{stats.lost}</span>
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

function SalesStatCard({ title, value, icon: Icon, trend, description, highlight = false, chartData = [], chartType = 'line' }: any) {
  return (
    <div className={cn(
      "p-6 border rounded-tl-2xl rounded-br-2xl shadow-lg transition-all hover:scale-105 cursor-pointer overflow-hidden",
      highlight ? "bg-primary text-white border-primary" : "bg-white text-primary border-primary/10"
    )}>
      <div className="flex justify-between items-start mb-4">
        <div className={cn(
          "h-12 w-12 flex items-center justify-center rounded-tl-lg rounded-br-lg",
          highlight ? "bg-white/10 text-accent" : "bg-primary/5 text-accent"
        )}>
          <Icon className="h-6 w-6" />
        </div>
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
                  dataKey="leads"
                  stroke={highlight ? "#ffffff" : "#0066cc"}
                  fill={highlight ? "#ffffff" : "#0066cc"}
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
              </AreaChart>
            ) : chartType === 'bar' ? (
              <BarChart data={chartData}>
                <Bar
                  dataKey="leads"
                  fill={highlight ? "#ffffff" : "#ff6b35"}
                  radius={[4, 4, 0, 0]}
                  opacity={0.8}
                />
              </BarChart>
            ) : (
              <LineChart data={chartData}>
                <Line
                  type="monotone"
                  dataKey="leads"
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
