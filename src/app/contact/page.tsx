'use client';
import { Header } from "@/components/shared/header";
import { Footer } from "@/components/shared/footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import Link from "next/link";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Phone, Mail, MapPin, ArrowRight } from "lucide-react";
import { useUsersFirestore } from "@/firebase";
import { collection, query, where } from "firebase/firestore";
import { useCollection } from "@/firebase/firestore/use-collection";
import { useMemo } from "react";

export default function ContactPage() {
  const contactImage = PlaceHolderImages.find(p => p.id === 'contact-hero');
  const firestore = useUsersFirestore();
  const settingsRef = firestore ? collection(firestore, 'settings') : null;
  const { data: settings } = useCollection<any>(
    settingsRef ? query(settingsRef, where('__name__', '==', 'branding')) : null
  );
  const branding = settings?.[0];
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">
        <section className="relative min-h-screen w-full flex items-end bg-primary">
          {branding?.contactHeroUrl && (
            <Image
              src={branding.contactHeroUrl}
              alt="Contact Hero"
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
                      Contact Us
                    </h1>
                  </div>
                  <div className="p-6 sm:p-8 space-y-4">
                    <p className="text-base sm:text-lg text-primary/80 leading-relaxed">
                      Get in touch with us using the details below or send us a message directly.
                    </p>
                    <Button size="lg" className="rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none bg-primary hover:bg-primary/90 text-white shadow-md transition-all" asChild>
                      <Link href="/courses">
                        View Courses <ArrowRight className="ml-2 h-5 w-5" />
                      </Link>
                    </Button>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </section>
        <section className="py-16 sm:py-20 bg-gray-50/50">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-12">
              <div>
                <div className="mb-8">
                  <Badge className="bg-accent/10 text-accent px-4 py-1.5 text-sm font-bold uppercase tracking-wider rounded-tl-md rounded-br-md rounded-tr-none rounded-bl-none mb-4">
                    Get In Touch
                  </Badge>
                  <h2 className="font-headline text-3xl sm:text-4xl font-bold text-primary">Contact Information</h2>
                </div>
                <div className="grid gap-6">
                  <Card className="border-2 border-primary/10 bg-white shadow-lg hover:shadow-xl transition-all rounded-tl-2xl rounded-br-2xl rounded-tr-none rounded-bl-none group">
                    <CardHeader className="flex flex-row items-center gap-4">
                      <div className="h-14 w-14 flex items-center justify-center rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-all duration-300">
                        <Phone className="h-7 w-7" />
                      </div>
                      <div>
                        <CardTitle className="font-headline text-xl text-primary">Phone</CardTitle>
                        <CardDescription className="text-base font-medium">+254 722 257 323</CardDescription>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-primary/70">Call us during business hours.</p>
                    </CardContent>
                  </Card>
                  <Card className="border-2 border-primary/10 bg-white shadow-lg hover:shadow-xl transition-all rounded-tl-2xl rounded-br-2xl rounded-tr-none rounded-bl-none group">
                    <CardHeader className="flex flex-row items-center gap-4">
                      <div className="h-14 w-14 flex items-center justify-center rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none bg-accent/10 text-accent group-hover:bg-accent group-hover:text-white transition-all duration-300">
                        <Mail className="h-7 w-7" />
                      </div>
                      <div>
                        <CardTitle className="font-headline text-xl text-primary">Email</CardTitle>
                        <CardDescription className="text-base font-medium">kss@cca.co.ke</CardDescription>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-primary/70">We respond within 24 hours.</p>
                    </CardContent>
                  </Card>
                  <Card className="border-2 border-primary/10 bg-white shadow-lg hover:shadow-xl transition-all rounded-tl-2xl rounded-br-2xl rounded-tr-none rounded-bl-none group">
                    <CardHeader className="flex flex-row items-center gap-4">
                      <div className="h-14 w-14 flex items-center justify-center rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-all duration-300">
                        <MapPin className="h-7 w-7" />
                      </div>
                      <div>
                        <CardTitle className="font-headline text-xl text-primary">Location</CardTitle>
                        <CardDescription className="text-base font-medium">Westlands, Nairobi, Kenya</CardDescription>
                      </div>
                    </CardHeader>
                  </Card>
                </div>
              </div>
              <div>
                <div className="mb-8">
                  <Badge className="bg-primary/10 text-primary px-4 py-1.5 text-sm font-bold uppercase tracking-wider rounded-tl-md rounded-br-md rounded-tr-none rounded-bl-none mb-4">
                    Find Us
                  </Badge>
                  <h2 className="font-headline text-3xl sm:text-4xl font-bold text-primary">Our Location</h2>
                </div>
                <Card className="border-2 border-primary/10 bg-white shadow-lg rounded-tl-2xl rounded-br-2xl rounded-tr-none rounded-bl-none overflow-hidden h-[450px]">
                  <iframe
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d4996.45613688772!2d36.79811877588709!3d-1.2592190987287823!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x182f109603a02185%3A0x51bed19705bed8a1!2sYusudi!5e1!3m2!1sen!2ske!4v1770121133258!5m2!1sen!2ske"
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
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
