'use client';
import Image from "next/image";
import Link from "next/link";
import { Header } from "@/components/shared/header";
import { Footer } from "@/components/shared/footer";
import { Card } from "@/components/ui/card";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Calendar, MapPin } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { useFirestore } from "@/firebase";
import { collection, query, where } from "firebase/firestore";
import { useCollection } from "@/firebase/firestore/use-collection";
import type { Program } from "@/lib/program-types";
import { useMemo } from "react";

export default function EventsPage() {
  const eventImage = PlaceHolderImages.find(p => p.id === 'event-conference-summit');
  const firestore = useFirestore();

  const eventsQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, "programs"), where("programType", "==", "Event"));
  }, [firestore]);

  const { data: events, loading } = useCollection<Program>(eventsQuery);

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">
        <section className="relative h-[560px] w-full">
            {eventImage && (
              <Image
                src={eventImage.imageUrl}
                alt={eventImage.description}
                fill
                className="object-cover"
                data-ai-hint={eventImage.imageHint}
              />
            )}
            <div className="absolute inset-0 bg-black/60" />
            <div className="relative z-10 h-full flex flex-col justify-end">
              <div className="container mx-auto px-4 py-16">
                <div className="max-w-3xl text-white">
                  <h1 className="font-headline text-4xl sm:text-5xl font-bold">
                    Upcoming Events
                  </h1>
                  <p className="mt-4 text-lg sm:text-xl text-white/90">
                    Join our webinars, workshops, and conferences to learn from industry experts and network with peers.
                  </p>
                </div>
              </div>
            </div>
          </section>

        <section className="py-16 sm:py-20">
          <div className="container mx-auto px-4">
             {loading && <div className="text-center">Loading events...</div>}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {events?.map((event) => {
                const eventImage = PlaceHolderImages.find(p => p.id === event.imageId);
                return (
                  <Link href={`/events/${event.id}`} key={event.id} className="block group">
                    <Card className="relative overflow-hidden h-96 border-0 shadow-lg rounded-lg">
                      {eventImage && (
                        <Image
                          src={eventImage.imageUrl}
                          alt={event.title}
                          fill
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                          data-ai-hint={eventImage.imageHint}
                        />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                      <div className="relative h-full flex flex-col justify-end p-6 text-white">
                        <h3 className="font-headline text-2xl font-bold">{event.title}</h3>
                        {event.date && <div className="flex items-center gap-2 text-sm mt-2">
                          <Calendar className="h-4 w-4" />
                          <span>{format(new Date(event.date), 'MMMM d, yyyy')}</span>
                        </div>}
                        <div className="flex justify-between items-center text-sm mt-4 font-medium">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            <span>{event.location}</span>
                          </div>
                          <Badge variant={event.price === 'Free' ? 'secondary' : 'default'}>{event.price}</Badge>
                        </div>
                      </div>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
