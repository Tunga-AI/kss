'use client';
import Image from "next/image";
import Link from "next/link";
import { Header } from "@/components/shared/header";
import { Footer } from "@/components/shared/footer";
import { Card } from "@/components/ui/card";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Badge } from "@/components/ui/badge";
import { useUsersFirestore } from "@/firebase";
import { collection, query, where } from "firebase/firestore";
import { useCollection } from "@/firebase/firestore/use-collection";
import type { Program } from "@/lib/program-types";
import { useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

function ProgramGrid({ programs }: { programs: Program[] }) {
  if (programs.length === 0) {
    return <div className="text-center py-10">No programs found for this category.</div>
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
      {programs.map((program) => {
        return (
          <Link href={`/courses/${program.slug}`} key={program.id} className="block group">
            <Card className="relative overflow-hidden h-96 border-0 shadow-lg rounded-tl-2xl rounded-br-2xl rounded-tr-none rounded-bl-none hover:shadow-2xl transition-all">
              {program.image && (
                <Image
                  src={program.image}
                  alt={program.programName}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
              <div className="relative h-full flex flex-col justify-end p-6 text-white">
                <Badge className={`${program.programType === 'Core' ? 'bg-accent text-white' : 'bg-primary text-white'} absolute top-4 left-4 rounded-tl-md rounded-br-md rounded-tr-none rounded-bl-none font-bold`}>
                  {program.programType || 'Program'}
                </Badge>
                <h3 className="font-headline text-2xl font-bold">{program.programName}</h3>
                <div className="flex justify-between items-center text-sm mt-4 font-medium">
                  <Badge variant="secondary" className="rounded-tl-sm rounded-br-sm rounded-tr-none rounded-bl-none">
                    Level {program.level}
                  </Badge>
                  <div className="text-right">
                    <span className="font-bold text-lg">{program.currency} {program.price?.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}


export default function CoursesPage() {
  const coursesImage = PlaceHolderImages.find(p => p.id === 'courses-hero');
  const firestore = useUsersFirestore(); // programs live in kenyasales DB
  const brandingFirestore = useUsersFirestore();
  const settingsRef = brandingFirestore ? collection(brandingFirestore, 'settings') : null;
  const { data: settings } = useCollection<any>(
    settingsRef ? query(settingsRef, where('__name__', '==', 'branding')) : null
  );
  const branding = settings?.[0];

  const coursesQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, "programs"));
  }, [firestore]);

  const { data: courses, loading } = useCollection<Program>(coursesQuery as any);

  const sortByLevel = (arr: Program[]) => [...arr].sort((a, b) => (a.level ?? 0) - (b.level ?? 0));
  const coreCourses = useMemo(() => sortByLevel(courses?.filter(c => c.programType === 'Core') || []), [courses]);
  const shortCourses = useMemo(() => sortByLevel(courses?.filter(c => c.programType === 'Short') || []), [courses]);
  const allCourses = useMemo(() => sortByLevel(courses || []), [courses]);

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">
        <section className="relative min-h-screen w-full flex items-end bg-primary">
          {branding?.programsHeroUrl && (
            <Image
              src={branding.programsHeroUrl}
              alt="Programs Hero"
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
                      Professional Sales Programs
                    </h1>
                  </div>
                  <div className="p-6 sm:p-8 space-y-4">
                    <p className="text-base sm:text-lg text-primary/80 leading-relaxed">
                      Professional sales programs designed to advance your skills and accelerate your career.
                    </p>
                    <Button size="lg" className="rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none bg-primary hover:bg-primary/90 text-white shadow-md transition-all" asChild>
                      <Link href="#programs">
                        Explore Programs <ArrowRight className="ml-2 h-5 w-5" />
                      </Link>
                    </Button>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </section>

        <section id="programs" className="py-16 sm:py-20">
          <div className="container mx-auto px-4">
            <Tabs defaultValue="all" className="w-full">
              <div className="flex justify-center mb-12">
                <TabsList>
                  <TabsTrigger value="all">All Programs</TabsTrigger>
                  <TabsTrigger value="core">Core Programs</TabsTrigger>
                  <TabsTrigger value="short">Short Programs</TabsTrigger>
                </TabsList>
              </div>
              {loading && <div className="text-center">Loading programs...</div>}
              {!loading && (
                <>
                  <TabsContent value="all">
                    <ProgramGrid programs={allCourses} />
                  </TabsContent>
                  <TabsContent value="core">
                    <ProgramGrid programs={coreCourses} />
                  </TabsContent>
                  <TabsContent value="short">
                    <ProgramGrid programs={shortCourses} />
                  </TabsContent>
                </>
              )}
            </Tabs>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
