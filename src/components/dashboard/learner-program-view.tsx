'use client';
import { useMemo } from 'react';
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUser } from '@/firebase';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import type { Program } from '@/lib/program-types';
import type { Transaction } from '@/lib/transactions-types';
import { LearnerProgramCard } from '@/components/dashboard/program-card';
import { Skeleton } from '@/components/ui/skeleton';

function ProgramGrid({ programs, enrolledProgramTitles }: { programs: Program[], enrolledProgramTitles: string[] }) {
    if (programs.length === 0) {
        return <div className="text-center py-10 text-muted-foreground">No programs found in this category.</div>
    }
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {programs.map((program) => (
                <LearnerProgramCard
                    key={program.id}
                    program={program}
                    isEnrolled={enrolledProgramTitles.includes(program.title)}
                />
            ))}
        </div>
    );
}

interface LearnerProgramViewProps {
    pageTitle: string;
    pageDescription: string;
    programTypes: Program['programType'][];
}

export function LearnerProgramView({ pageTitle, pageDescription, programTypes }: LearnerProgramViewProps) {
    const { user, loading: userLoading } = useUser();
    const firestore = useFirestore();

    const programsQuery = useMemo(() => {
        if (!firestore) return null;
        return query(collection(firestore, "programs"), where("programType", "in", programTypes));
    }, [firestore, programTypes]);

    const transactionsQuery = useMemo(() => {
        if (!firestore || !user) return null;
        return query(collection(firestore, 'transactions'), where('learnerEmail', '==', user.email), where('status', '==', 'Success'));
    }, [firestore, user]);

    const { data: programs, loading: programsLoading } = useCollection<Program>(programsQuery);
    const { data: transactions, loading: transactionsLoading } = useCollection<Transaction>(transactionsQuery);

    const enrolledProgramTitles = useMemo(() => {
        return transactions?.map(t => t.program) || [];
    }, [transactions]);

    const enrolledPrograms = useMemo(() => {
        return programs?.filter(p => enrolledProgramTitles.includes(p.title)) || [];
    }, [programs, enrolledProgramTitles]);

    const notEnrolledPrograms = useMemo(() => {
        return programs?.filter(p => !enrolledProgramTitles.includes(p.title)) || [];
    }, [programs, enrolledProgramTitles]);
    
    const loading = userLoading || programsLoading || transactionsLoading;

    if (loading) {
        return (
             <div className="grid gap-6">
                <Skeleton className="h-24 w-full rounded-lg" />
                <div className="flex justify-center">
                     <Skeleton className="h-10 w-72 rounded-md" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-96 w-full rounded-lg" />)}
                </div>
            </div>
        )
    }

    return (
        <div className="grid gap-6">
            <Card className="bg-primary text-primary-foreground">
                <CardHeader>
                    <CardTitle className="font-headline text-xl sm:text-2xl">{pageTitle}</CardTitle>
                    <CardDescription className="text-primary-foreground/80">{pageDescription}</CardDescription>
                </CardHeader>
            </Card>

            <Tabs defaultValue="all" className="w-full">
                <div className="flex justify-center mb-8">
                    <TabsList>
                        <TabsTrigger value="all">All Programs</TabsTrigger>
                        <TabsTrigger value="enrolled">My Programs</TabsTrigger>
                        <TabsTrigger value="explore">Explore</TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="all">
                    <ProgramGrid programs={programs || []} enrolledProgramTitles={enrolledProgramTitles} />
                </TabsContent>
                <TabsContent value="enrolled">
                    <ProgramGrid programs={enrolledPrograms} enrolledProgramTitles={enrolledProgramTitles} />
                </TabsContent>
                <TabsContent value="explore">
                    <ProgramGrid programs={notEnrolledPrograms} enrolledProgramTitles={enrolledProgramTitles} />
                </TabsContent>
            </Tabs>
        </div>
    );
}
