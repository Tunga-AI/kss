'use client';
import Image from "next/image";
import Link from "next/link";
import { Header } from "@/components/shared/header";
import { Footer } from "@/components/shared/footer";
import { Card } from "@/components/ui/card";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Badge } from "@/components/ui/badge";
import { useFirestore } from "@/firebase";
import { collection, query, where } from "firebase/firestore";
import { useCollection } from "@/firebase/firestore/use-collection";
import type { Program } from "@/lib/program-types";
import { useMemo } from "react";

export default function ShortCoursesPage() {
  const coursesImage = PlaceHolderImages.find(p => p.id === 'courses-hero');
  const firestore = useFirestore();

  const coursesQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, "programs"), where("programType", "==", "Short"));
  }, [firestore]);

  const { data: courses, loading } = useCollection<Program>(coursesQuery);

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">
        <section className="relative h-[560px] w-full">
          {coursesImage && (
            <Image
              src={coursesImage.imageUrl}
              alt={coursesImage.description}
              fill
              className="object-cover"
              data-ai-hint={coursesImage.imageHint}
            />
          )}
          <div className="absolute inset-0 bg-black/60" />
          <div className="relative z-10 h-full flex flex-col justify-end">
            <div className="container mx-auto px-4 py-16">
              <div className="max-w-3xl text-white">
                <h1 className="font-headline text-4xl sm:text-5xl font-bold">
                  Short Courses
                </h1>
                <p className="mt-4 text-lg sm:text-xl text-white/90">
                  Explore our short courses for focused skill development.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 sm:py-20">
          <div className="container mx-auto px-4">
             {loading && <div className="text-center">Loading courses...</div>}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
              {courses?.map((course) => {
                return (
                  <Link href={`/short-courses/${course.id}`} key={course.id} className="block group">
                    <Card className="relative overflow-hidden h-96 border-0 shadow-lg rounded-lg">
                      {course.imageUrl && (
                        <Image
                          src={course.imageUrl}
                          alt={course.title}
                          fill
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                      <div className="relative h-full flex flex-col justify-end p-6 text-white">
                        <h3 className="font-headline text-2xl font-bold">{course.title}</h3>
                        <div className="flex justify-between items-center text-sm mt-4 font-medium">
                          <Badge variant="secondary">{course.level}</Badge>
                          <span className="font-bold text-lg">{course.price}</span>
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
