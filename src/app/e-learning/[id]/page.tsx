'use client';
import Image from "next/image";
import { useParams, notFound } from "next/navigation";
import { Header } from "@/components/shared/header";
import { Footer } from "@/components/shared/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, Clock, BarChart } from "lucide-react";
import { useFirestore } from "@/firebase";
import { collection, query, where, limit } from "firebase/firestore";
import { useCollection } from "@/firebase/firestore/use-collection";
import type { Program } from "@/lib/program-types";
import { useMemo } from "react";
import { ProgramRegistration } from "@/components/payments/ProgramRegistration";

export default function ElearningCourseDetailPage() {
  const params = useParams();
  const slug = Array.isArray(params.id) ? params.id[0] : params.id;
  const firestore = useFirestore();

  const programQuery = useMemo(() => {
    if (!firestore || !slug) return null;
    return query(collection(firestore, 'programs'), where('slug', '==', slug), limit(1));
  }, [firestore, slug]);

  const { data: programs, loading } = useCollection<Program>(programQuery);
  const course = useMemo(() => programs?.[0], [programs]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!course || course.programType !== 'E-Learning') {
    notFound();
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative h-[560px] w-full">
          {course.imageUrl && (
             <Image
                src={course.imageUrl}
                alt={course.title}
                fill
                className="object-cover"
            />
          )}
          <div className="absolute inset-0 bg-black/60" />
          <div className="relative z-10 h-full flex flex-col justify-end">
            <div className="container mx-auto px-4 py-16">
              <div className="max-w-3xl text-white">
                <Badge>{course.level}</Badge>
                <h1 className="font-headline text-4xl sm:text-5xl lg:text-6xl font-bold mt-4">
                  {course.title}
                </h1>
                <p className="mt-4 text-lg sm:text-xl text-white/90">
                  {course.description}
                </p>
                 <div className="mt-8">
                  <ProgramRegistration program={course} />
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Course Details Section */}
        <section className="py-16 sm:py-20">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-3 gap-8 md:gap-12">
              {/* Main Content */}
              <div className="md:col-span-2">
                <h2 className="font-headline text-3xl sm:text-4xl font-bold mb-6">What You'll Learn</h2>
                <ul className="space-y-4">
                  {course.takeaways?.map((takeaway, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <CheckCircle className="h-6 w-6 text-accent flex-shrink-0 mt-1" />
                      <span className="text-base sm:text-lg">{takeaway}</span>
                    </li>
                  ))}
                </ul>
              </div>
              {/* Sidebar */}
              <div>
                <Card>
                  <CardHeader>
                    <CardTitle className="font-headline text-xl sm:text-2xl">Course Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Clock className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-semibold">Duration</p>
                        <p className="text-muted-foreground">{course.duration}</p>
                      </div>
                    </div>
                     <div className="flex items-center gap-3">
                      <BarChart className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-semibold">Level</p>
                        <p className="text-muted-foreground">{course.level}</p>
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
