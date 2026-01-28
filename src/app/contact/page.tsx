import { Header } from "@/components/shared/header";
import { Footer } from "@/components/shared/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images";

export default function ContactPage() {
  const contactImage = PlaceHolderImages.find(p => p.id === 'contact-hero');
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">
        <section className="relative h-[560px] w-full">
            {contactImage && (
              <Image
                src={contactImage.imageUrl}
                alt={contactImage.description}
                fill
                className="object-cover"
                data-ai-hint={contactImage.imageHint}
              />
            )}
            <div className="absolute inset-0 bg-black/60" />
            <div className="relative z-10 h-full flex flex-col justify-end">
              <div className="container mx-auto px-4 py-16">
                <div className="max-w-3xl text-white">
                  <h1 className="font-headline text-4xl sm:text-5xl font-bold">
                    Contact
                  </h1>
                  <p className="mt-4 text-lg sm:text-xl text-white/90">
                    Have a question? We'd love to hear from you.
                  </p>
                </div>
              </div>
            </div>
          </section>
        <section className="py-16 sm:py-20">
            <div className="container mx-auto px-4 max-w-2xl">
                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline">Send a Message</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form className="grid gap-6">
                             <div className="grid gap-3">
                                <Label htmlFor="name">Name</Label>
                                <Input id="name" type="text" placeholder="Your Name" />
                            </div>
                             <div className="grid gap-3">
                                <Label htmlFor="email">Email</Label>
                                <Input id="email" type="email" placeholder="your@email.com" />
                            </div>
                             <div className="grid gap-3">
                                <Label htmlFor="message">Message</Label>
                                <Textarea id="message" placeholder="Your message..." rows={6}/>
                            </div>
                            <Button type="submit">Send Message</Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

    