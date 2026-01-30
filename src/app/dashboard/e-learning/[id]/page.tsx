'use client';
import Image from "next/image";
import { useParams, notFound, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, Clock, BarChart, ArrowLeft } from "lucide-react";
import { useFirestore, useUser } from "@/firebase";
import { collection, query, where, limit } from "firebase/firestore";
import { useCollection } from "@/firebase/firestore/use-collection";
import type { Program } from "@/lib/program-types";
import type { Transaction } from '@/lib/transactions-types';
import { useMemo } from "react";
import { ProgramRegistration } from "@/components/payments/ProgramRegistration";
import { Skeleton } from "@/components/ui/skeleton";

export default function LearnerElearningDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = Array.isArray(params.id) ? params.id[0] : params.id;
  
  const { user, loading: userLoading } = useUser();
  const firestore = useFirestore();

  const programQuery = useMemo(() => {
    if (!firestore || !slug) return null;
    return query(collection(firestore, 'programs'), where('slug', '==', slug), limit(1));
  }, [firestore, slug]);

  const transactionsQuery = useMemo(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'transactions'), where('learnerEmail', '==', user.email), where('status', '==', 'Success'));
  }, [firestore, user]);

  const { data: programs, loading: programsLoading } = useCollection<Program>(programQuery);
  const { data: transactions, loading: transactionsLoading } = useCollection<Transaction>(transactionsQuery);
  
  const course = useMemo(() => programs?.[0], [programs]);

  const isEnrolled = useMemo(() => {
    if (!course || !transactions) return false;
    return transactions.some(t => t.program === course.title);
  }, [course, transactions]);

  const loading = userLoading || programsLoading || transactionsLoading;

  if (loading) {
    return (
        <div className="grid gap-6">
            <div className="flex items-center gap-4">
                <Skeleton className="h-10 w-10" />
                <Skeleton className="h-8 w-48" />
            </div>
            <Skeleton className="h-96 w-full" />
            <div className="grid md:grid-cols-3 gap-8">
                <Skeleton className="md:col-span-2 h-64 w-full" />
                <Skeleton className="h-48 w-full" />
            </div>
        </div>
    );
  }
  
  if (!course || course.programType !== 'E-Learning') {
    notFound();
  }

  return (
    <div className="grid gap-6">
      <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
              <ArrowLeft />
          </Button>
          <h1 className="font-headline text-xl sm:text-2xl font-bold">{course.title}</h1>
      </div>
      <Card>
        <CardHeader className="relative h-64 md:h-96 p-0">
          {course.imageUrl && (
             <Image
                src={course.imageUrl}
                alt={course.title}
                fill
                className="object-cover rounded-t-lg"
            />
          )}
           <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent rounded-t-lg" />
           <div className="relative h-full flex flex-col justify-end p-6 text-white">
                <Badge>{course.level}</Badge>
                <CardTitle className="font-headline text-3xl sm:text-4xl font-bold mt-2">
                  {course.title}
                </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-6">
            <div className="grid md:grid-cols-3 gap-8">
              <div className="md:col-span-2">
                <h2 className="font-headline text-2xl font-bold mb-4">Description</h2>
                <p className="text-muted-foreground">{course.description}</p>
                 <h2 className="font-headline text-2xl font-bold mt-8 mb-4">What You'll Learn</h2>
                <ul className="space-y-3">
                  {course.takeaways?.map((takeaway, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-accent flex-shrink-0 mt-1" />
                      <span>{takeaway}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="space-y-6">
                  <Card>
                      <CardHeader>
                        <CardTitle className="font-headline text-lg">Course Details</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4 text-sm">
                        <div className="flex items-center gap-3">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-semibold">Duration</p>
                            <p className="text-muted-foreground">{course.duration}</p>
                          </div>
                        </div>
                         <div className="flex items-center gap-3">
                          <BarChart className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-semibold">Level</p>
                            <p className="text-muted-foreground">{course.level}</p>
                          </div>
                        </div>
                      </CardContent>
                  </Card>
                 <div>
                    {isEnrolled ? (
                        <Button size="lg" className="w-full" disabled>You are Registered</Button>
                    ) : (
                        <ProgramRegistration program={course} />
                    )}
                 </div>
              </div>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
