'use client';
import Image from "next/image";
import Link from "next/link";
import { Header } from "@/components/shared/header";
import { Footer } from "@/components/shared/footer";
import { Card } from "@/components/ui/card";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Calendar, MapPin, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { useUsersFirestore } from "@/firebase";
import { collection, query, where } from "firebase/firestore";
import { useCollection } from "@/firebase/firestore/use-collection";
import type { Program } from "@/lib/program-types";
import { useMemo } from "react";

export default function EventsPage() {
  const eventImage = PlaceHolderImages.find(p => p.id === 'event-conference-summit');
  const firestore = useUsersFirestore(); // programs live in kenyasales DB

  const eventsQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, "programs"), where("programType", "==", "Event"));
  }, [firestore]);

  const { data: events, loading } = useCollection<Program & { date?: string, location?: string }>(eventsQuery as any);

  const brandingFirestore = useUsersFirestore();
  const settingsRef = brandingFirestore ? collection(brandingFirestore, 'settings') : null;
  const { data: settings } = useCollection<any>(
    settingsRef ? query(settingsRef, where('__name__', '==', 'branding')) : null
  );
  const branding = settings?.[0];

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">
        <section className="relative min-h-screen w-full flex items-end bg-primary">
          {branding?.eventsHeroUrl && (
            <Image
              src={branding.eventsHeroUrl}
              alt="Events Hero"
              fill
              className="object-cover"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/50 to-transparent" />
          <div className="relative z-10 w-full">
            <div className="container mx-auto px-4 lg:px-6 py-20 pb-16">
              <div className="max-w-4xl">
                <Card className="bg-white border-0 shadow-2xl rounded-tl-3xl rounded-br-3xl rounded-tr-none rounded-bl-none overflow-hidden">
                  <div className="bg-accent p-6 sm:p-8">
                    <h1 className="font-headline text-3xl sm:text-4xl lg:text-5xl font-bold text-white">
                      Upcoming Events
                    </h1>
                  </div>
                  <div className="p-6 sm:p-8 space-y-4">
                    <p className="text-base sm:text-lg text-primary/80 leading-relaxed">
                      Join our webinars, workshops, and conferences for learning and networking opportunities.
                    </p>
                    <Button size="lg" className="rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none bg-primary hover:bg-primary/90 text-white shadow-md transition-all" asChild>
                      <Link href="/courses">
                        View All Programs <ArrowRight className="ml-2 h-5 w-5" />
                      </Link>
                    </Button>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 sm:py-20">
          <div className="container mx-auto px-4">
            {loading && <div className="text-center">Loading events...</div>}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {events?.map((event) => {
                return (
                  <Link href={`/events/${event.slug}`} key={event.id} className="block group">
                    <Card className="relative overflow-hidden h-96 border-0 shadow-lg rounded-tl-2xl rounded-br-2xl rounded-tr-none rounded-bl-none hover:shadow-2xl transition-all">
                      {event.imageUrl && (
                        <Image
                          src={event.imageUrl}
                          alt={event.title || event.programName || ''}
                          fill
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                      <div className="relative h-full flex flex-col justify-end p-6 text-white">
                        <h3 className="font-headline text-2xl font-bold">{event.title || event.programName}</h3>
                        {event.date && <div className="flex items-center gap-2 text-sm mt-2">
                          <Calendar className="h-4 w-4" />
                          <span>{format(new Date(event.date), 'MMMM d, yyyy')}</span>
                        </div>}
                        <div className="flex justify-between items-center text-sm mt-4 font-medium">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            <span>{event.location}</span>
                          </div>
                          {event.registrationFee ? (
                            <div className="text-right">
                              <p className="text-xs text-white/60">Registration</p>
                              <span className="font-bold text-accent">{event.registrationFee}</span>
                            </div>
                          ) : (
                            <Badge className={`${event.price === 0 ? 'bg-accent text-white' : 'bg-primary text-white'} rounded-tl-sm rounded-br-sm rounded-tr-none rounded-bl-none font-bold`}>{event.price === 0 ? 'Free' : (event.price || 'Free')}</Badge>
                          )}
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
