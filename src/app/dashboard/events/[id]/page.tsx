'use client';
import Image from "next/image";
import { useParams, notFound, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, MapPin, Ticket, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { useFirestore, useUser } from "@/firebase";
import { collection, query, where, limit } from "firebase/firestore";
import { useCollection } from "@/firebase/firestore/use-collection";
import type { Program } from "@/lib/program-types";
import type { Transaction } from '@/lib/transactions-types';
import { useMemo } from "react";
import { ProgramRegistration } from "@/components/payments/ProgramRegistration";
import { Skeleton } from "@/components/ui/skeleton";

export default function LearnerEventDetailPage() {
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
  
  const event = useMemo(() => programs?.[0], [programs]);

  const isEnrolled = useMemo(() => {
    if (!event || !transactions) return false;
    return transactions.some(t => t.program === event.title);
  }, [event, transactions]);
  
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
                <Skeleton className="h-64 w-full" />
            </div>
        </div>
    );
  }

  if (!event || event.programType !== 'Event') {
    notFound();
  }

  return (
    <div className="grid gap-6">
       <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
              <ArrowLeft />
          </Button>
          <h1 className="font-headline text-xl sm:text-2xl font-bold">{event.title}</h1>
      </div>
      <Card>
        <CardHeader className="relative h-64 md:h-96 p-0">
          {event.imageUrl && (
             <Image
                src={event.imageUrl}
                alt={event.title}
                fill
                className="object-cover rounded-t-lg"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent rounded-t-lg" />
           <div className="relative h-full flex flex-col justify-end p-6 text-white">
                {event.date && <p className="font-semibold text-accent">{format(new Date(event.date), "EEEE, MMMM d, yyyy")}</p>}
                <CardTitle className="font-headline text-3xl sm:text-4xl font-bold mt-2">
                  {event.title}
                </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-6">
             <div className="grid md:grid-cols-3 gap-8 md:gap-12">
              <div className="md:col-span-2">
                <h2 className="font-headline text-2xl font-bold mb-4">About This Event</h2>
                <p className="text-muted-foreground">{event.description}</p>
                
                {event.speakers && event.speakers.length > 0 && <>
                    <h2 className="font-headline text-2xl font-bold mt-8 mb-4">Speakers</h2>
                    <div className="grid gap-8 sm:grid-cols-2">
                    {event.speakers?.map((speaker) => (
                        <div key={speaker.name} className="flex items-center gap-4">
                        <Avatar className="h-16 w-16">
                            <AvatarImage src={speaker.avatar} alt={speaker.name} />
                            <AvatarFallback>{speaker.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="font-bold text-lg">{speaker.name}</p>
                            <p className="text-muted-foreground">{speaker.title}</p>
                        </div>
                        </div>
                    ))}
                    </div>
                </>}
              </div>
              
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="font-headline text-lg">Event Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 text-sm">
                    {event.date && <div className="flex items-start gap-3">
                      <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold">Date</p>
                        <p className="text-muted-foreground">{format(new Date(event.date), 'MMMM d, yyyy')}</p>
                      </div>
                    </div>}
                     <div className="flex items-start gap-3">
                      <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold">Time</p>
                        <p className="text-muted-foreground">{event.time}</p>
                      </div>
                    </div>
                     <div className="flex items-start gap-3">
                      <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold">Location</p>
                        <p className="text-muted-foreground">{event.location}</p>
                      </div>
                    </div>
                     <div className="flex items-start gap-3">
                      <Ticket className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold">Price</p>
                        <p className="text-muted-foreground">{event.price}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                 <div>
                    {isEnrolled ? (
                        <Button size="lg" className="w-full" disabled>You are Registered</Button>
                    ) : (
                        <ProgramRegistration program={event} />
                    )}
                 </div>
              </div>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
