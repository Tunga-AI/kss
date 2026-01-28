import Image from "next/image";
import { notFound } from "next/navigation";
import { Header } from "@/components/shared/header";
import { Footer } from "@/components/shared/footer";
import { events } from "@/lib/events-data";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, MapPin, Ticket } from "lucide-react";
import { format } from "date-fns";

export default function EventDetailPage({ params }: { params: { id: string } }) {
  const event = events.find((e) => e.id === params.id);

  if (!event) {
    notFound();
  }

  const eventImage = PlaceHolderImages.find(p => p.id === event.imageId);

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">
        <section className="relative h-[560px] w-full">
          {eventImage && (
             <Image
                src={eventImage.imageUrl}
                alt={event.title}
                fill
                className="object-cover"
                data-ai-hint={eventImage.imageHint}
            />
          )}
          <div className="absolute inset-0 bg-black/60" />
          <div className="relative z-10 h-full flex flex-col justify-end">
            <div className="container mx-auto px-4 py-16">
              <div className="max-w-3xl text-white">
                <p className="font-semibold text-accent">{format(new Date(event.date), "EEEE, MMMM d, yyyy")}</p>
                <h1 className="font-headline text-4xl sm:text-5xl lg:text-6xl font-bold mt-2">
                  {event.title}
                </h1>
                <div className="mt-8 flex gap-4">
                  <Button size="lg">Register Now</Button>
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
                  {event.speakers.map((speaker) => (
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
                    <div className="flex items-start gap-3">
                      <Calendar className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-1" />
                      <div>
                        <p className="font-semibold">Date</p>
                        <p className="text-muted-foreground">{format(new Date(event.date), 'MMMM d, yyyy')}</p>
                      </div>
                    </div>
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
                        <p className="font-semibold">Price</p>
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

    