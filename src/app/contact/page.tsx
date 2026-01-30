import { Header } from "@/components/shared/header";
import { Footer } from "@/components/shared/footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Phone, Mail, MapPin } from "lucide-react";

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
                    Contact Us
                  </h1>
                  <p className="mt-4 text-lg sm:text-xl text-white/90">
                    Have a question? We'd love to hear from you. Get in touch with us using the details below or send us a message.
                  </p>
                </div>
              </div>
            </div>
          </section>
        <section className="py-16 sm:py-20">
            <div className="container mx-auto px-4">
                <div className="grid md:grid-cols-2 gap-12">
                     <div>
                        <h2 className="font-headline text-3xl font-bold mb-8">Get In Touch</h2>
                        <div className="grid gap-6">
                            <Card>
                                <CardHeader className="flex flex-row items-center gap-4">
                                    <Phone className="h-8 w-8 text-primary"/>
                                    <div>
                                        <CardTitle className="font-headline text-xl">Phone</CardTitle>
                                        <CardDescription>+254 722 257 323</CardDescription>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground">Call us during business hours.</p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="flex flex-row items-center gap-4">
                                    <Mail className="h-8 w-8 text-primary"/>
                                    <div>
                                        <CardTitle className="font-headline text-xl">Email</CardTitle>
                                        <CardDescription>kss@cca.co.ke</CardDescription>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground">We respond within 24 hours.</p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="flex flex-row items-center gap-4">
                                    <MapPin className="h-8 w-8 text-primary"/>
                                    <div>
                                        <CardTitle className="font-headline text-xl">Location</CardTitle>
                                        <CardDescription>Westlands, Nairobi, Kenya</CardDescription>
                                    </div>
                                </CardHeader>
                            </Card>
                        </div>
                    </div>
                    <div>
                         <Card>
                            <CardHeader>
                                <CardTitle className="font-headline text-3xl">Send a Message</CardTitle>
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
                </div>
            </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
