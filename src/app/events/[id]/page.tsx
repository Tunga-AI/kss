'use client';
import Image from "next/image";
import { useParams, notFound } from "next/navigation";
import { Header } from "@/components/shared/header";
import { Footer } from "@/components/shared/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, MapPin, Ticket } from "lucide-react";
import { format } from "date-fns";
import { useUsersFirestore } from "@/firebase";
import { collection, query, where, limit } from "firebase/firestore";
import { useCollection } from "@/firebase/firestore/use-collection";
import type { Program } from "@/lib/program-types";
import { useMemo } from "react";
import { ProgramRegistration } from "@/components/payments/ProgramRegistration";

export default function EventDetailPage() {
  const params = useParams();
  const slug = Array.isArray(params.id) ? params.id[0] : params.id;
  const firestore = useUsersFirestore(); // programs live in kenyasales DB

  const programQuery = useMemo(() => {
    if (!firestore || !slug) return null;
    return query(collection(firestore, 'programs'), where('slug', '==', slug), limit(1));
  }, [firestore, slug]);

  const { data: programs, loading } = useCollection<Program>(programQuery as any);
  const event = useMemo(() => programs?.[0], [programs]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!event || event.programType !== 'Event') {
    notFound();
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">
        <section className="relative h-[560px] w-full">
          {event.imageUrl && (
            <Image
              src={event.imageUrl}
              alt={event.title}
              fill
              className="object-cover"
            />
          )}
          <div className="absolute inset-0 bg-black/60" />
          <div className="relative z-10 h-full flex flex-col justify-end">
            <div className="container mx-auto px-4 py-16">
              <div className="max-w-3xl text-white">
                {event.date && <p className="font-semibold text-accent">{format(new Date(event.date), "EEEE, MMMM d, yyyy")}</p>}
                <h1 className="font-headline text-4xl sm:text-5xl lg:text-6xl font-bold mt-2">
                  {event.title}
                </h1>
                <div className="mt-8 flex gap-4">
                  <ProgramRegistration program={event} />
                  <Button size="lg" variant="secondary">Add to Calendar</Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 sm:py-20">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-3 gap-8 md:gap-12">
              <div className="md:col-span-2">
                <h2 className="font-headline text-3xl sm:text-4xl font-bold mb-6">About This Event</h2>
                <p className="text-lg text-foreground/80">{event.description}</p>

                <h2 className="font-headline text-3xl sm:text-4xl font-bold mt-12 mb-6">Speakers</h2>
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
              </div>

              <div>
                <Card>
                  <CardHeader>
                    <CardTitle className="font-headline text-xl sm:text-2xl">Event Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {event.date && <div className="flex items-start gap-3">
                      <Calendar className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-1" />
                      <div>
                        <p className="font-semibold">Date</p>
                        <p className="text-muted-foreground">{format(new Date(event.date), 'MMMM d, yyyy')}</p>
                      </div>
                    </div>}
                    <div className="flex items-start gap-3">
                      <Clock className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-1" />
                      <div>
                        <p className="font-semibold">Time</p>
                        <p className="text-muted-foreground">{event.time}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <MapPin className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-1" />
                      <div>
                        <p className="font-semibold">Location</p>
                        <p className="text-muted-foreground">{event.location}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Ticket className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-1" />
                      <div>
                        <p className="font-semibold">Ticket Price</p>
                        <p className="text-muted-foreground">{event.price}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
