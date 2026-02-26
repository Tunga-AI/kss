'use client';
import { useMemo } from 'react';
import Link from 'next/link';
import { Header } from "@/components/shared/header";
import { Footer } from "@/components/shared/footer";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUsersFirestore, useCollection } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import type { MediaAlbum } from '@/lib/media-types';
import { ArrowRight, ImageIcon } from 'lucide-react';

const testimonials = [
  {
    name: "Alex Johnson",
    role: "Senior Account Executive",
    avatarId: "testimonial-1",
    testimonial: "KSS Institute transformed my career. The negotiation tactics I learned were instrumental in closing the biggest deal of my career.",
  },
  {
    name: "Maria Garcia",
    role: "Sales Development Manager",
    avatarId: "testimonial-2",
    testimonial: "The courses are incredibly practical and relevant. I was able to apply what I learned immediately.",
  },
];

export default function GalleryPage() {
  const mediaFirestore = useUsersFirestore(); // gallery media lives in kenyasales DB

  // Query Published Albums
  const albumsQuery = useMemo(() => {
    if (!mediaFirestore) return null;
    return query(
      collection(mediaFirestore, "media"),
      where("status", "==", "published")
    );
  }, [mediaFirestore]);

  const { data: rawAlbums, loading } = useCollection<MediaAlbum>(albumsQuery as any);

  const albums = useMemo(() => {
    if (!rawAlbums) return [];
    return [...rawAlbums].sort((a, b) => {
      const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(0);
      const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(0);
      return dateB.getTime() - dateA.getTime();
    });
  }, [rawAlbums]);

  const brandingFirestore = useUsersFirestore();
  const settingsRef = brandingFirestore ? collection(brandingFirestore, 'settings') : null;
  const { data: settings } = useCollection<any>(
    settingsRef ? query(settingsRef, where('__name__', '==', 'branding')) : null
  );
  const branding = settings?.[0];

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative min-h-screen w-full flex items-end bg-primary overflow-hidden">
          {branding?.galleryHeroUrl && (
            <Image
              src={branding.galleryHeroUrl}
              alt="Gallery Hero"
              fill
              className="object-cover opacity-60"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-primary/50 to-primary/30" />
          <div className="relative z-10 w-full">
            <div className="container mx-auto px-4 lg:px-6 py-20 pb-16">
              <div className="max-w-4xl">
                <Card className="bg-white border-0 shadow-2xl rounded-tl-3xl rounded-br-3xl rounded-tr-none rounded-bl-none overflow-hidden">
                  <div className="bg-accent p-6 sm:p-8">
                    <p className="text-white/80 text-sm font-bold uppercase tracking-widest mb-2">
                      Media Center
                    </p>
                    <h1 className="font-headline text-3xl sm:text-4xl lg:text-5xl font-bold text-white">
                      Captured Moments
                    </h1>
                  </div>
                  <div className="p-6 sm:p-8 space-y-4">
                    <p className="text-base sm:text-lg text-primary/80 leading-relaxed">
                      Explore our collection of event highlights, workshop sessions, and graduation ceremonies.
                    </p>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Albums Grid Section */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
              <div>
                <h2 className="font-headline text-3xl sm:text-4xl font-bold">Event Albums</h2>
                <p className="mt-2 text-muted-foreground max-w-xl text-base sm:text-lg">
                  Browse through our latest activities and captured moments.
                </p>
              </div>
            </div>

            {loading && <div className="text-center py-20 text-muted-foreground">Loading albums...</div>}

            {!loading && (!albums || albums.length === 0) && (
              <div className="text-center py-24 bg-white rounded-3xl border border-dashed border-primary/10">
                <ImageIcon className="h-16 w-16 mx-auto text-primary/20 mb-4" />
                <h3 className="text-xl font-bold text-primary">No albums yet</h3>
                <p className="text-primary/60 mt-2">Check back soon for new content.</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {albums?.map((album) => (
                <Link href={`/gallery/${album.id}`} key={album.id} className="group block">
                  <Card className="relative overflow-hidden h-96 border-0 shadow-lg rounded-tl-2xl rounded-br-2xl rounded-tr-none rounded-bl-none hover:shadow-2xl transition-all">
                    {album.featuredImage ? (
                      <Image
                        src={album.featuredImage}
                        alt={album.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-muted-foreground">
                        <ImageIcon className="h-16 w-16 opacity-20" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-80" />
                    <div className="relative h-full flex flex-col justify-end p-6 text-white z-10">
                      <h3 className="font-headline text-2xl font-bold mb-2 group-hover:text-accent transition-colors">
                        {album.title}
                      </h3>
                      {album.description && (
                        <p className="text-white/80 text-sm line-clamp-2 mb-4 font-medium">
                          {album.description}
                        </p>
                      )}
                      <div className="flex items-center text-accent text-sm font-bold uppercase tracking-wide">
                        View Album <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
