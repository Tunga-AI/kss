'use client';

import { use, useMemo, useState } from 'react';
import { notFound } from 'next/navigation';
import { useUsersFirestore, useDoc, useCollection } from '@/firebase';
import { doc, collection, query, where } from 'firebase/firestore';
import type { User } from '@/lib/user-types';
import type { LearningModule } from '@/lib/learning-types';
import type { Cohort } from '@/lib/cohort-types';
import { UserForm } from '../../users/user-form';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { BookOpen, Users, Mail, Shield, ShieldCheck, Activity, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function FacilitatorDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const firestore = useUsersFirestore();

    const userRef = useMemo(() => {
        if (!firestore || !id) return null;
        return doc(firestore, 'users', id);
    }, [firestore, id]);

    const { data: user, loading } = useDoc<User>(userRef as any);

    // Fetch related modules
    const unitsQuery = useMemo(() => firestore ? query(collection(firestore, 'learningUnits'), where('facilitatorId', '==', id)) : null, [firestore, id]);
    const { data: units } = useCollection<LearningModule>(unitsQuery as any);

    // Fetch all cohorts
    const cohortsQuery = useMemo(() => firestore ? query(collection(firestore, 'cohorts')) : null, [firestore]);
    const { data: allCohorts } = useCollection<Cohort>(cohortsQuery as any);

    const committees = useMemo(() => {
        if (!allCohorts) return [];
        return allCohorts.filter(c => c.council?.includes(id));
    }, [allCohorts, id]);

    if (!firestore || loading) {
        return (
            <div className="p-8 grid gap-6">
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-96 w-full" />
            </div>
        );
    }

    if (!user) {
        notFound();
    }

    return (
        <div className="w-full min-h-screen bg-gray-50/50 font-body">
            {/* Minimal Header */}
            <div className="bg-primary text-white p-6 md:p-8 rounded-b-3xl shadow-xl relative overflow-hidden mb-8">
                <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-accent/20 rounded-full blur-3xl opacity-20" />

                <div className="relative z-10 flex flex-col md:flex-row gap-6 items-center md:items-start max-w-6xl mx-auto">
                    <Avatar className="h-32 w-32 rounded-tl-3xl rounded-br-3xl rounded-tr-none rounded-bl-none border-4 border-white/10 shadow-lg">
                        <AvatarImage src={user.avatar} alt={user.name} className="object-cover" />
                        <AvatarFallback className="rounded-none bg-primary/20 text-white font-bold text-4xl">
                            {user.name.charAt(0)}
                        </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 text-center md:text-left space-y-2">
                        <div className="flex items-center gap-3 justify-center md:justify-start">
                            <ShieldCheck className="h-6 w-6 text-accent" />
                            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">{user.name}</h1>
                        </div>
                        <div className="flex flex-wrap gap-4 items-center justify-center md:justify-start font-medium text-white/70">
                            <span className="flex items-center gap-2">
                                <Mail className="h-4 w-4" /> {user.email}
                            </span>
                            <span className="flex items-center gap-2">
                                <Shield className="h-4 w-4" /> {user.role}
                            </span>
                            <Badge className={user.status === 'Active' ? 'bg-green-500 hover:bg-green-600' : 'bg-white/20'}>
                                {user.status}
                            </Badge>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
                <Tabs defaultValue="overview" className="w-full">
                    <TabsList className="bg-white border border-primary/10 shadow-sm p-1 rounded-xl h-auto flex flex-wrap mb-8">
                        <TabsTrigger value="overview" className="flex-1 font-bold text-sm h-12 data-[state=active]:bg-primary data-[state=active]:text-white">
                            <Activity className="h-4 w-4 mr-2" /> Overview & Assignments
                        </TabsTrigger>
                        <TabsTrigger value="profile" className="flex-1 font-bold text-sm h-12 data-[state=active]:bg-primary data-[state=active]:text-white">
                            <Shield className="h-4 w-4 mr-2" /> Profile Configuration
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-6">
                        {/* Metrics */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <Card className="bg-white shadow-md border-primary/10 rounded-tl-2xl rounded-br-2xl">
                                <CardContent className="p-6">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Assigned Units</p>
                                            <p className="text-4xl font-bold text-primary">{units?.length || 0}</p>
                                        </div>
                                        <div className="h-12 w-12 rounded-xl bg-purple-50 flex items-center justify-center">
                                            <BookOpen className="h-6 w-6 text-purple-600" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-white shadow-md border-primary/10 rounded-tl-2xl rounded-br-2xl">
                                <CardContent className="p-6">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Admission Committees</p>
                                            <p className="text-4xl font-bold text-accent">{committees.length}</p>
                                        </div>
                                        <div className="h-12 w-12 rounded-xl bg-accent/10 flex items-center justify-center">
                                            <Users className="h-6 w-6 text-accent" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-white shadow-md border-primary/10 rounded-tl-2xl rounded-br-2xl">
                                <CardContent className="p-6">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Member Since</p>
                                            <p className="text-2xl font-bold text-primary mt-2">
                                                {user.createdAt ? format(user.createdAt.toDate(), 'MMM yyyy') : 'N/A'}
                                            </p>
                                        </div>
                                        <div className="h-12 w-12 rounded-xl bg-blue-50 flex items-center justify-center">
                                            <Calendar className="h-6 w-6 text-blue-600" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Detail Lists */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Assigned Units */}
                            <Card className="bg-white shadow-md border-primary/10 rounded-tl-2xl rounded-br-2xl overflow-hidden">
                                <CardHeader className="bg-primary/5 border-b border-primary/10">
                                    <CardTitle className="text-lg font-bold text-primary flex items-center gap-2">
                                        <BookOpen className="h-5 w-5 text-accent" /> Assigned Teaching Units
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <div className="divide-y divide-primary/5 max-h-[500px] overflow-y-auto">
                                        {units && units.length > 0 ? units.map(unit => (
                                            <div key={unit.id} className="p-4 hover:bg-gray-50/50 transition-colors">
                                                <div className="flex justify-between items-start mb-2">
                                                    <h4 className="font-bold text-primary">{unit.title}</h4>
                                                    <Badge variant="outline" className="text-[10px] bg-primary/5">
                                                        {unit.deliveryType}
                                                    </Badge>
                                                </div>
                                                <p className="text-xs text-gray-500 line-clamp-2">{unit.description}</p>
                                                {unit.scheduledStartDate && (
                                                    <div className="mt-3 text-[10px] font-bold text-primary/60 flex items-center gap-1 bg-white border border-gray-100 px-2 py-1 rounded inline-flex">
                                                        <Calendar className="h-3 w-3" />
                                                        {format(unit.scheduledStartDate.toDate(), 'MMM do, yyyy h:mm a')}
                                                    </div>
                                                )}
                                            </div>
                                        )) : (
                                            <div className="p-8 text-center text-gray-400">
                                                <BookOpen className="h-10 w-10 mx-auto mb-2 opacity-50" />
                                                <p className="text-sm font-bold uppercase tracking-widest">No units assigned</p>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Committees */}
                            <Card className="bg-white shadow-md border-primary/10 rounded-tl-2xl rounded-br-2xl overflow-hidden">
                                <CardHeader className="bg-primary/5 border-b border-primary/10">
                                    <CardTitle className="text-lg font-bold text-primary flex items-center gap-2">
                                        <Users className="h-5 w-5 text-accent" /> Admissions Committees
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <div className="divide-y divide-primary/5 max-h-[500px] overflow-y-auto">
                                        {committees.length > 0 ? committees.map(cohort => (
                                            <div key={cohort.id} className="p-4 hover:bg-gray-50/50 transition-colors flex justify-between items-center">
                                                <div>
                                                    <h4 className="font-bold text-primary">{cohort.name}</h4>
                                                    <p className="text-xs text-gray-500 mt-1 uppercase tracking-widest font-bold">Intake Programs</p>
                                                </div>
                                                <Badge className={
                                                    cohort.status === 'Accepting Applications' ? 'bg-green-500/10 text-green-700' :
                                                        cohort.status === 'Closed' ? 'bg-gray-100 text-gray-600' : 'bg-accent/10 text-accent'
                                                } variant="outline">
                                                    {cohort.status}
                                                </Badge>
                                            </div>
                                        )) : (
                                            <div className="p-8 text-center text-gray-400">
                                                <Users className="h-10 w-10 mx-auto mb-2 opacity-50" />
                                                <p className="text-sm font-bold uppercase tracking-widest">No committee memberships</p>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="profile" className="m-0">
                        {/* 
                            We reuse the UserForm here but visually distinct using a wrapper 
                            Since UserForm has its own hero banner, we might need a modified container. 
                            If we just render UserForm, it could clash with our page design, but let's see.
                            Alternatively, since UserForm manages everything internally, we can hide our own hero when in profile tab, or rely on UserForm.
                        */}
                        <div className="bg-white shadow-xl border border-primary/10 rounded-2xl overflow-hidden">
                            <UserForm user={user} />
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
