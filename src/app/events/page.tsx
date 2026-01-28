import Image from "next/image";
import Link from "next/link";
import { Header } from "@/components/shared/header";
import { Footer } from "@/components/shared/footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { events } from "@/lib/events-data";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { ArrowRight, Calendar, Clock, MapPin } from "lucide-react";
import { format } from "date-fns";

export default function EventsPage() {
  const eventImage = PlaceHolderImages.find(p => p.id === 'event-conference-summit');
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {events.map((event) => {
                const eventImage = PlaceHolderImages.find(p => p.id === event.imageId);
                return (
                  <Card key={event.id} className="flex flex-col overflow-hidden hover:shadow-lg transition-shadow duration-300">
                    {eventImage && (
                      <div className="relative h-48 w-full">
                        <Image
                          src={eventImage.imageUrl}
                          alt={eventImage.description}
                          fill
                          className="object-cover"
                          data-ai-hint={eventImage.imageHint}
                        />
                      </div>
                    )}
                    <CardHeader>
                      <CardTitle className="font-headline text-lg sm:text-xl">{event.title}</CardTitle>
                      <CardDescription className="line-clamp-2">{event.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow space-y-3 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4"/>
                            <span>{format(new Date(event.date), 'MMMM d, yyyy')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4"/>
                            <span>{event.location}</span>
                        </div>
                    </CardContent>
                    <CardContent className="flex justify-between items-center">
                      <span className="font-bold text-primary">{event.price}</span>
                       <Button asChild variant="secondary">
                        <Link href={`/events/${event.id}`}>View Event <ArrowRight className="ml-2 h-4 w-4"/></Link>
                      </Button>
                    </CardContent>
                  </Card>
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

    