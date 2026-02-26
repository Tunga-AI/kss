'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useUser, useUsersFirestore, useCollection, useDoc } from '@/firebase';
import { collection, query, where, doc } from 'firebase/firestore';
import type { User as BusinessUser } from '@/lib/user-types';
import type { Organization } from '@/lib/organization-types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Users, CreditCard, Building2, ArrowRight, TrendingUp, Award, CalendarDays,
  RefreshCw, CheckCircle, AlertCircle, Loader2, UserPlus, BarChart3, BookOpen
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export default function BusinessDashboardPage() {
  const { user: currentUser, loading: userLoading } = useUser();
  const firestore = useUsersFirestore();

  // Fetch organization
  const orgRef = useMemo(() => {
    if (!firestore || !currentUser?.organizationId) return null;
    return doc(firestore, 'organizations', currentUser.organizationId);
  }, [firestore, currentUser]);

  const { data: org, loading: orgLoading } = useDoc<Organization>(orgRef as any);

  // Fetch team members
  const learnersQuery = useMemo(() => {
    if (!firestore || !currentUser?.organizationId) return null;
    return query(collection(firestore, 'users'), where('organizationId', '==', currentUser.organizationId));
  }, [firestore, currentUser]);

  const { data: teamMembers, loading: learnersLoading } = useCollection<BusinessUser>(learnersQuery as any);

  const loading = userLoading || orgLoading || learnersLoading;

  const activeLearners = teamMembers?.filter(m => m.status === 'Active' && m.role === 'BusinessLearner') || [];
  const admins = teamMembers?.filter(m => m.role === 'BusinessAdmin') || [];
  const usedSeats = teamMembers?.length || 0;
  const maxSeats = org?.maxLearners || 0;
  const seatUsagePercent = maxSeats > 0 ? Math.round((usedSeats / maxSeats) * 100) : 0;

  const isAdmin = currentUser?.role === 'BusinessAdmin';

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If org isn't set up yet, show setup prompt
  if (isAdmin && org && !org.isSetupComplete) {
    return (
      <div className="w-full min-h-screen bg-gray-50/50 p-4 sm:p-6 lg:p-10">
        <div className="max-w-2xl mx-auto">
          <div className="bg-primary rounded-tl-3xl rounded-br-3xl rounded-tr-sm rounded-bl-sm p-8 text-white text-center mb-8">
            <Building2 className="h-16 w-16 text-accent mx-auto mb-4" />
            <h1 className="font-headline text-3xl font-bold mb-3">Welcome to KSS Business!</h1>
            <p className="text-white/70 text-lg">Let's get your organization set up so your team can start learning.</p>
          </div>
          <Card className="border-primary/10 rounded-tl-2xl rounded-br-2xl rounded-tr-none rounded-bl-none shadow-lg">
            <CardHeader>
              <CardTitle className="font-headline text-xl text-primary">Complete Your Setup</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { step: 1, title: 'Set up your organization profile', desc: 'Add your company details, logo, and contact information.', done: false },
                { step: 2, title: 'Add your team members', desc: 'Invite learners by adding their names and emails.', done: false },
                { step: 3, title: 'Assign programs', desc: 'Enroll your team in KSS programs and events.', done: false },
              ].map(s => (
                <div key={s.step} className="flex items-start gap-4 p-4 border border-primary/10 rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none">
                  <div className={cn(
                    "h-8 w-8 rounded-full flex items-center justify-center text-sm font-black flex-shrink-0",
                    s.done ? "bg-green-500 text-white" : "bg-primary/10 text-primary"
                  )}>
                    {s.done ? <CheckCircle className="h-4 w-4" /> : s.step}
                  </div>
                  <div>
                    <p className="font-bold text-primary text-sm">{s.title}</p>
                    <p className="text-primary/60 text-xs mt-1">{s.desc}</p>
                  </div>
                </div>
              ))}
              <Button className="w-full h-12 bg-accent hover:bg-accent/90 text-white font-bold rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none" asChild>
                <Link href="/b/setup">
                  Start Setup
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gray-50/50 p-2 md:p-4 lg:p-6">
      {/* Hero Section */}
      <div className="bg-primary text-white p-6 mb-6 rounded-tl-3xl rounded-br-3xl rounded-tr-none rounded-bl-none shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-accent/20 rounded-full blur-3xl opacity-20" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Building2 className="h-8 w-8 text-accent" />
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold">{org?.name || 'Your Organization'}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className={cn(
                    "text-[9px] font-black uppercase tracking-widest border-none px-2",
                    org?.status === 'Active' ? 'bg-green-500 text-white' :
                      org?.status === 'Trial' ? 'bg-amber-500 text-white' :
                        'bg-red-500 text-white'
                  )}>
                    {org?.status || 'Active'}
                  </Badge>
                  <Badge className="bg-white/10 text-white text-[9px] font-black uppercase tracking-widest border-none px-2">
                    {org?.tier} Plan
                  </Badge>
                </div>
              </div>
            </div>
            <p className="text-white/70 text-sm">
              Welcome back, <span className="text-white font-bold">{currentUser?.name?.split(' ')[0] || 'Admin'}</span>!
              {org?.subscriptionEndDate && (
                <span className="ml-2">Subscription valid until <strong>{format(org.subscriptionEndDate.toDate(), 'MMM d, yyyy')}</strong></span>
              )}
            </p>
          </div>
          {isAdmin && (
            <div className="flex gap-3">
              <Button className="bg-secondary hover:bg-secondary/90 text-white font-bold h-11 px-5 rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none" asChild>
                <Link href="/b/learners">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Manage Team
                </Link>
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          icon={Users}
          label="Team Members"
          value={usedSeats.toString()}
          subtitle={`of ${maxSeats} seats used`}
          color="text-primary"
          bgColor="bg-primary/10"
        />
        <StatCard
          icon={CheckCircle}
          label="Active Learners"
          value={activeLearners.length.toString()}
          subtitle="currently active"
          color="text-green-600"
          bgColor="bg-green-100"
        />
        <StatCard
          icon={BarChart3}
          label="Seat Utilization"
          value={`${seatUsagePercent}%`}
          subtitle={`${maxSeats - usedSeats} seats remaining`}
          color="text-accent"
          bgColor="bg-accent/10"
        />
        <StatCard
          icon={CalendarDays}
          label="Subscription"
          value={org?.subscriptionEndDate ? format(org.subscriptionEndDate.toDate(), 'MMM yyyy') : 'N/A'}
          subtitle="expiry date"
          color="text-secondary"
          bgColor="bg-secondary/10"
        />
      </div>

      {/* Main content grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Seat usage progress bar */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="border-primary/10 rounded-tl-2xl rounded-br-2xl rounded-tr-none rounded-bl-none shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-black uppercase tracking-widest text-primary/50">Seat Capacity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-bold text-primary">{usedSeats} used</span>
                <span className="text-primary/50">{maxSeats} total</span>
              </div>
              <div className="h-3 bg-primary/10 rounded-full overflow-hidden">
                <div
                  className={cn("h-full rounded-full transition-all", seatUsagePercent >= 90 ? "bg-red-500" : seatUsagePercent >= 70 ? "bg-amber-500" : "bg-accent")}
                  style={{ width: `${seatUsagePercent}%` }}
                />
              </div>
              <p className="text-xs text-primary/50 mt-2">{maxSeats - usedSeats} seats remaining</p>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          {isAdmin && (
            <Card className="border-primary/10 rounded-tl-2xl rounded-br-2xl rounded-tr-none rounded-bl-none shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-black uppercase tracking-widest text-primary/50">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="grid sm:grid-cols-2 gap-3">
                {[
                  { href: '/b/learners', icon: UserPlus, label: 'Add Team Member', desc: 'Invite a new learner to your org' },
                  { href: '/b/finance', icon: CreditCard, label: 'View Finances', desc: 'See subscription & payment history' },
                  { href: '/', icon: BookOpen, label: 'Browse Programs', desc: 'Explore KSS courses for your team' },
                  { href: '/b/learners', icon: BarChart3, label: 'Team Progress', desc: 'Track your team learning journey' },
                ].map(action => (
                  <Link
                    key={action.href + action.label}
                    href={action.href}
                    className="flex items-center gap-3 p-3 border border-primary/10 rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none hover:border-accent/30 hover:bg-accent/5 transition-all group"
                  >
                    <div className="h-10 w-10 bg-primary/5 rounded-lg flex items-center justify-center group-hover:bg-accent group-hover:text-white transition-all flex-shrink-0">
                      <action.icon className="h-5 w-5 text-primary group-hover:text-white transition-colors" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-primary text-sm leading-tight">{action.label}</p>
                      <p className="text-primary/50 text-xs mt-0.5">{action.desc}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-primary/30 group-hover:text-accent ml-auto flex-shrink-0 transition-all group-hover:translate-x-0.5" />
                  </Link>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Team Members list */}
        <Card className="border-primary/10 rounded-tl-2xl rounded-br-2xl rounded-tr-none rounded-bl-none shadow-sm">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-black uppercase tracking-widest text-primary/50">Team Members</CardTitle>
            {isAdmin && (
              <Link href="/b/learners" className="text-xs text-accent font-bold hover:underline flex items-center gap-1">
                View All <ArrowRight className="h-3 w-3" />
              </Link>
            )}
          </CardHeader>
          <CardContent className="space-y-2">
            {teamMembers && teamMembers.slice(0, 8).map(member => (
              <div key={member.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-primary/5 transition-colors">
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarImage src={member.avatar || undefined} alt={member.name} />
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                    {member.name?.charAt(0)?.toUpperCase() || '?'}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-primary text-xs truncate">{member.name}</p>
                  <p className="text-primary/40 text-[10px] truncate">{member.email}</p>
                </div>
                <Badge className={cn(
                  "text-[8px] font-black uppercase tracking-widest border-none flex-shrink-0",
                  member.role === 'BusinessAdmin' ? 'bg-accent text-white' : 'bg-primary/10 text-primary'
                )}>
                  {member.role === 'BusinessAdmin' ? 'Admin' : 'Learner'}
                </Badge>
              </div>
            ))}
            {(!teamMembers || teamMembers.length === 0) && (
              <div className="text-center py-8 text-primary/40">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-xs font-bold uppercase">No team members yet</p>
                {isAdmin && (
                  <Button size="sm" className="mt-3 bg-accent hover:bg-accent/90 text-white font-bold rounded-tl-lg rounded-br-lg rounded-tr-none rounded-bl-none" asChild>
                    <Link href="/b/learners">Add First Learner</Link>
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, subtitle, color, bgColor }: {
  icon: any;
  label: string;
  value: string;
  subtitle: string;
  color: string;
  bgColor: string;
}) {
  return (
    <Card className="border-primary/10 rounded-tl-2xl rounded-br-2xl rounded-tr-none rounded-bl-none shadow-sm bg-white">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-4 px-4">
        <CardTitle className="text-xs font-black uppercase tracking-widest text-primary/50">{label}</CardTitle>
        <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center", bgColor)}>
          <Icon className={cn("h-4 w-4", color)} />
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <div className={cn("text-3xl font-black", color)}>{value}</div>
        <p className="text-xs text-primary/40 mt-0.5 font-medium">{subtitle}</p>
      </CardContent>
    </Card>
  );
}
