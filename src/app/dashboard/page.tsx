'use client';
import { useMemo } from 'react';
import Link from "next/link";
import { useUser, useFirestore, useCollection } from '@/firebase';
import { collection, query, where, orderBy, limit } from 'firebase/firestore';
import type { Transaction } from '@/lib/transactions-types';
import type { Certificate } from '@/lib/certificate-types';
import type { Program } from '@/lib/program-types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, BookCopy, Award, CalendarCheck, Loader2 } from "lucide-react";
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardPage() {
    const { user, loading: userLoading } = useUser();
    const firestore = useFirestore();

    const transactionsQuery = useMemo(() => {
        if (!firestore || !user?.email) return null;
        return query(
            collection(firestore, 'transactions'),
            where('learnerEmail', '==', user.email),
            where('status', '==', 'Success'),
            orderBy('date', 'desc')
        );
    }, [firestore, user]);

    const certificatesQuery = useMemo(() => {
        if (!firestore || !user?.email) return null;
        return query(collection(firestore, 'certificates'), where('learnerEmail', '==', user.email));
    }, [firestore, user]);
    
    // We need all programs to find the slug for the most recent course
    const programsQuery = useMemo(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'programs'));
    }, [firestore]);

    const { data: transactions, loading: transactionsLoading } = useCollection<Transaction>(transactionsQuery);
    const { data: certificates, loading: certificatesLoading } = useCollection<Certificate>(certificatesQuery);
    const { data: programs, loading: programsLoading } = useCollection<Program>(programsQuery);

    const loading = userLoading || transactionsLoading || certificatesLoading || programsLoading;

    const stats = useMemo(() => {
        if (!transactions || !certificates || !programs) return { enrolled: 0, completed: 0, events: 0 };
        const courseTransactions = transactions.filter(t => t.program && !programs.find(p => p.title === t.program && p.programType === 'Event'));
        const eventTransactions = transactions.filter(t => t.program && programs.find(p => p.title === t.program && p.programType === 'Event'));
        
        return {
            enrolled: courseTransactions.length,
            completed: certificates.length,
            events: eventTransactions.length,
        };
    }, [transactions, certificates, programs]);

    const mostRecentEnrollment = useMemo(() => {
        if (!transactions || transactions.length === 0 || !programs) return null;
        const mostRecentTransaction = transactions[0];
        const programDetails = programs.find(p => p.title === mostRecentTransaction.program);
        if (!programDetails) return null;
        
        let url = '/l/courses'; // default
        if (programDetails.programType === 'E-Learning') url = `/l/e-learning/${programDetails.slug}`;
        if (programDetails.programType === 'Core' || programDetails.programType === 'Short') url = `/l/courses/${programDetails.slug}`;
        if (programDetails.programType === 'Event') url = `/l/events/${programDetails.slug}`;

        return {
            title: programDetails.title,
            url,
        };
    }, [transactions, programs]);

    if (loading) {
        return (
             <div className="grid gap-6">
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-40 w-full" />
            </div>
        )
    }

    return (
        <div className="grid gap-6">
            <Card className="bg-primary text-primary-foreground">
                <CardHeader>
                    <CardTitle className="font-headline text-xl sm:text-2xl">Welcome Back, {user?.name?.split(' ')[0]}!</CardTitle>
                    <CardDescription className="text-primary-foreground/80">Here's a quick overview of your learning journey. Keep up the great work!</CardDescription>
                </CardHeader>
                 <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                        <Card>
                            <CardHeader className="items-center">
                                <BookCopy className="h-6 w-6 mb-2"/>
                                <CardTitle className="font-headline text-2xl sm:text-3xl">{stats.enrolled}</CardTitle>
                                <CardDescription>Courses Enrolled</CardDescription>
                            </CardHeader>
                        </Card>
                        <Card>
                            <CardHeader className="items-center">
                                <Award className="h-6 w-6 mb-2"/>
                                <CardTitle className="font-headline text-2xl sm:text-3xl">{stats.completed}</CardTitle>
                                <CardDescription>Certificates Earned</CardDescription>
                            </CardHeader>
                        </Card>
                        <Card>
                            <CardHeader className="items-center">
                                <CalendarCheck className="h-6 w-6 mb-2"/>
                                <CardTitle className="font-headline text-2xl sm:text-3xl">{stats.events}</CardTitle>
                                <CardDescription>Events Attended</CardDescription>
                            </CardHeader>
                        </Card>
                    </div>
                </CardContent>
            </Card>
            
            {mostRecentEnrollment ? (
                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline">Continue Your Journey</CardTitle>
                        <CardDescription>Ready to dive back in? Pick up where you left off.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <h3 className="font-semibold">{mostRecentEnrollment.title}</h3>
                        <p className="text-sm text-muted-foreground mt-1">You recently enrolled in this program. Click below to view it.</p>
                    </CardContent>
                    <CardContent>
                        <Button asChild>
                            <Link href={mostRecentEnrollment.url}>Continue Learning <ArrowRight className="ml-2 h-4 w-4"/></Link>
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                 <Card>
                    <CardHeader>
                        <CardTitle className="font-headline">Start Your Learning Journey</CardTitle>
                        <CardDescription>You haven't enrolled in any programs yet. Explore our catalog to find your next learning opportunity.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button asChild>
                            <Link href="/l/courses">Explore Courses <ArrowRight className="ml-2 h-4 w-4"/></Link>
                        </Button>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
