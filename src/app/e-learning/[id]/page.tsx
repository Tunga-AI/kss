'use client';
import Image from "next/image";
import { useParams, notFound } from "next/navigation";
import { Header } from "@/components/shared/header";
import { Footer } from "@/components/shared/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, BarChart, Tag, Users, CalendarDays, ChevronRight } from "lucide-react";
import { useUsersFirestore } from "@/firebase";
import { collection, query, where, limit } from "firebase/firestore";
import { useCollection } from "@/firebase/firestore/use-collection";
import type { Program } from "@/lib/program-types";
import type { Cohort } from "@/lib/cohort-types";
import { useMemo, useState } from "react";
import { ProgramRegistration } from "@/components/payments/ProgramRegistration";
import { cn } from "@/lib/utils";

export default function ElearningCourseDetailPage() {
  const params = useParams();
  const slug = Array.isArray(params.id) ? params.id[0] : params.id;
  const firestore = useUsersFirestore(); // programs live in kenyasales DB
  const [selectedCohortId, setSelectedCohortId] = useState<string>('');

  const programQuery = useMemo(() => {
    if (!firestore || !slug) return null;
    return query(collection(firestore, 'programs'), where('slug', '==', slug), limit(1));
  }, [firestore, slug]);

  const { data: programs, loading } = useCollection<Program>(programQuery as any);
  const course = useMemo(() => programs?.[0], [programs]);

  const cohortsQuery = useMemo(() => {
    if (!firestore || !course?.id) return null;
    return query(
      collection(firestore, 'cohorts'),
      where('programId', '==', course.id),
      where('status', '==', 'Accepting Applications')
    );
  }, [firestore, course?.id]);

  const { data: cohorts } = useCollection<Cohort>(cohortsQuery as any);

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
                  <ProgramRegistration program={course} selectedCohortId={selectedCohortId} />
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

              {/* Course Details Section */}
              <div className="md:col-span-3">
                <Card>
                  <CardHeader>
                    <CardTitle className="font-headline text-xl sm:text-2xl">Course Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
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
                      {course.price && (
                        <div className="flex items-center gap-3">
                          <Tag className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="font-semibold">Program Fee</p>
                            <p className="text-muted-foreground">{course.price}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Available Cohorts / Intakes */}
              {cohorts && cohorts.length > 0 && (
                <div className="md:col-span-3">
                  <h2 className="font-headline text-2xl sm:text-3xl font-bold mb-4 flex items-center gap-2">
                    <Users className="h-6 w-6 text-accent" />
                    Available Intakes
                  </h2>
                  <p className="text-muted-foreground mb-6">
                    Select the intake you want to join for this e-learning program.
                  </p>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {cohorts.map((cohort) => (
                      <button
                        key={cohort.id}
                        type="button"
                        onClick={() => setSelectedCohortId(cohort.id === selectedCohortId ? '' : cohort.id)}
                        className={cn(
                          "text-left p-5 rounded-tl-2xl rounded-br-2xl border-2 transition-all",
                          selectedCohortId === cohort.id
                            ? "border-accent bg-accent/5"
                            : "border-primary/10 bg-white hover:border-primary/30"
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-primary">{cohort.name}</p>
                            {cohort.description && (
                              <p className="text-sm text-muted-foreground mt-1">{cohort.description}</p>
                            )}
                            {(cohort.startDate || cohort.endDate) && (
                              <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                                <CalendarDays className="h-3.5 w-3.5" />
                                <span>
                                  {cohort.startDate && new Date(cohort.startDate).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}
                                  {cohort.startDate && cohort.endDate && ' – '}
                                  {cohort.endDate && new Date(cohort.endDate).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className={cn(
                            "h-6 w-6 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all",
                            selectedCohortId === cohort.id ? "border-accent bg-accent" : "border-primary/20"
                          )}>
                            {selectedCohortId === cohort.id && <ChevronRight className="h-3 w-3 text-white" />}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
