import { Header } from "@/components/shared/header";
import { Footer } from "@/components/shared/footer";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const testimonials = [
  {
    name: "Alex Johnson",
    role: "Senior Account Executive",
    avatarId: "testimonial-1",
    testimonial: "KSS Institute transformed my career. The negotiation tactics I learned were instrumental in closing the biggest deal of my career. I can't recommend them enough!",
  },
  {
    name: "Maria Garcia",
    role: "Sales Development Manager",
    avatarId: "testimonial-2",
    testimonial: "The courses are incredibly practical and relevant. I was able to apply what I learned immediately and saw a significant improvement in my team's performance.",
  },
  {
    name: "Sam Chen",
    role: "Founder, Tech Startup",
    avatarId: "testimonial-3",
    testimonial: "As a founder, I needed to learn how to sell. KSS gave me the confidence and the framework to build a successful sales process from scratch. Invaluable!",
  },
   {
    name: "Sarah Williams",
    role: "Enterprise Account Manager",
    avatarId: "user4",
    testimonial: "The CRM Mastery course was a game-changer. I'm now more organized and efficient than ever before, and my sales numbers prove it.",
  },
];

export default function GalleryPage() {
  const successImage = PlaceHolderImages.find(p => p.id === 'success-hero');
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">
        <section className="relative h-[560px] w-full">
            {successImage && (
              <Image
                src={successImage.imageUrl}
                alt={successImage.description}
                fill
                className="object-cover"
                data-ai-hint={successImage.imageHint}
              />
            )}
            <div className="absolute inset-0 bg-black/60" />
            <div className="relative z-10 h-full flex flex-col justify-end">
              <div className="container mx-auto px-4 py-16">
                <div className="max-w-3xl text-white">
                  <h1 className="font-headline text-4xl sm:text-5xl font-bold">
                    Gallery
                  </h1>
                  <p className="mt-4 text-lg sm:text-xl text-white/90">
                    See the impact of our training through the stories of our graduates.
                  </p>
                </div>
              </div>
            </div>
          </section>
        <section className="py-16 sm:py-20">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {testimonials.map((testimonial) => {
                const avatarImage = PlaceHolderImages.find(p => p.id === testimonial.avatarId);
                return (
                  <Card key={testimonial.name}>
                    <CardContent className="pt-6">
                      <p className="text-lg text-muted-foreground italic">"{testimonial.testimonial}"</p>
                    </CardContent>
                    <CardHeader>
                       <div className="flex items-center gap-4">
                         {avatarImage && (
                            <Avatar>
                                <AvatarImage src={avatarImage.imageUrl} alt={testimonial.name} data-ai-hint={avatarImage.imageHint} />
                                <AvatarFallback>{testimonial.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                         )}
                        <div>
                            <p className="font-semibold text-lg">{testimonial.name}</p>
                            <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                        </div>
                    </div>
                    </CardHeader>
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
