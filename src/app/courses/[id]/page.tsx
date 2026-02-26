'use client';
import Image from "next/image";
import { useParams, notFound } from "next/navigation";
import { Header } from "@/components/shared/header";
import { Footer } from "@/components/shared/footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, BarChart, Users, ClipboardList, CheckCircle } from "lucide-react";
import { useUsersFirestore } from "@/firebase";
import { collection, query, where, limit } from "firebase/firestore";
import { useCollection } from "@/firebase/firestore/use-collection";
import type { Program } from "@/lib/program-types";
import type { Cohort } from "@/lib/cohort-types";
import { useMemo, useState } from "react";
import { EnrollmentSection } from "@/components/enrollment/EnrollmentSection";

export default function CourseDetailPage() {
  const params = useParams();
  const slug = Array.isArray(params.id) ? params.id[0] : params.id;
  const firestore = useUsersFirestore(); // programs live in kenyasales DB
  const [selectedCohortId, setSelectedCohortId] = useState<string>('');

  const programQuery = useMemo(() => {
    if (!firestore || !slug) return null;
    return query(collection(firestore, 'programs'), where('slug', '==', slug), limit(1));
  }, [firestore, slug]);

  const { data: programs, loading: collectionLoading } = useCollection<Program>(programQuery as any);
  const loading = collectionLoading || !firestore;
  const course = useMemo(() => programs?.[0], [programs]);

  // Fetch actual cohorts from the 'cohorts' collection matching this program
  const cohortsQuery = useMemo(() => {
    if (!firestore || !course?.id) return null;
    return query(
      collection(firestore, 'cohorts'),
      where('programIds', 'array-contains', course.id)
    );
  }, [firestore, course?.id]);

  const { data: fetchedCohorts } = useCollection<Cohort>(cohortsQuery as any);

  const intakes = useMemo(() => {
    if (!fetchedCohorts) return [];
    return fetchedCohorts.filter(c => c.status === 'Accepting Applications');
  }, [fetchedCohorts]);

  if (loading) {
    return <div className="p-20 text-center">Loading program details...</div>;
  }

  if (!course) {
    notFound();
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative h-[560px] w-full bg-gray-900">
          {course.image && (
            <Image
              src={course.image}
              alt={course.programName}
              fill
              className="object-cover opacity-60"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/40 to-transparent" />
          <div className="relative z-10 h-full flex flex-col justify-end">
            <div className="container mx-auto px-4 py-16">
              <div className="max-w-3xl text-white">
                <Badge className="bg-accent text-white border-0 mb-4 text-base px-3 py-1">Level {course.level}</Badge>
                <h1 className="font-headline text-4xl sm:text-5xl lg:text-6xl font-bold mt-2 leading-tight">
                  {course.programName}
                </h1>
                <p className="mt-6 text-lg sm:text-xl text-gray-200 leading-relaxed max-w-2xl">
                  {course.shortDescription}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Program Details Section */}
        <section className="py-16 sm:py-20">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              {/* Main Content (Left 2 columns) */}
              <div className="lg:col-span-2 space-y-12">

                {/* Objectives */}
                {course.objectives && course.objectives.length > 0 && (
                  <div>
                    <h2 className="font-headline text-3xl font-bold mb-6">What You'll Learn</h2>
                    <ul className="grid sm:grid-cols-1 gap-4">
                      {course.objectives.map((objective, index) => (
                        <li key={index} className="flex items-start gap-4 p-4 rounded-xl bg-primary/5 border border-primary/10">
                          <CheckCircle className="h-6 w-6 text-accent flex-shrink-0 mt-0.5" />
                          <span className="text-base text-gray-700 font-medium">{objective}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Curriculum */}
                {course.curriculumBreakdown && course.curriculumBreakdown.length > 0 && (
                  <div>
                    <h2 className="font-headline text-3xl font-bold mb-6">Curriculum Breakdown</h2>
                    <div className="space-y-6">
                      {course.curriculumBreakdown.map((module, idx) => (
                        <Card key={idx} className="border-0 shadow-md overflow-hidden">
                          <div className="bg-primary/5 border-l-4 border-accent p-6">
                            <h3 className="font-bold text-xl text-primary mb-2">{module.name}</h3>
                            <div className="space-y-3 text-sm">
                              <div>
                                <span className="font-bold text-gray-500 uppercase text-xs tracking-wider block mb-1">Key Modules</span>
                                <p className="text-gray-700">{module.keyModules}</p>
                              </div>
                              {module.themes && (
                                <div>
                                  <span className="font-bold text-gray-500 uppercase text-xs tracking-wider block mb-1">Themes</span>
                                  <p className="text-gray-700">{module.themes}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Who is it for */}
                {course.whoIsItFor && course.whoIsItFor.length > 0 && (
                  <div>
                    <h2 className="font-headline text-2xl font-bold mb-4">Who Is It For?</h2>
                    <ul className="list-disc pl-5 space-y-2 text-gray-700">
                      {course.whoIsItFor.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Completion Requirements */}
                {course.completionRequirements && course.completionRequirements.length > 0 && (
                  <div>
                    <h2 className="font-headline text-2xl font-bold mb-4 flex items-center gap-2">
                      <ClipboardList className="h-6 w-6 text-accent" />
                      Completion Requirements
                    </h2>
                    <ul className="space-y-3">
                      {course.completionRequirements.map((req, i) => (
                        <li key={i} className="flex items-start gap-3 p-4 rounded-xl bg-gray-50 border border-gray-100">
                          <CheckCircle className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                          <span className="text-gray-700 text-sm leading-relaxed">{req}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

              </div>

              {/* Sidebar (Right column) */}
              <div className="space-y-8">
                <Card className="sticky top-24 border-0 shadow-xl overflow-hidden rounded-2xl">
                  <div className="bg-primary p-6 text-white text-center">
                    <p className="text-sm font-medium opacity-80 uppercase tracking-widest mb-1">Program Fee</p>
                    <div className="text-4xl font-bold mb-1">
                      <span className="text-2xl align-top mr-1 font-medium">{course.currency}</span>
                      {course.price?.toLocaleString()}
                    </div>
                  </div>
                  <CardContent className="p-6 space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-4 text-gray-700">
                        <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center text-primary">
                          <Clock className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-bold text-sm text-gray-500 uppercase">Duration</p>
                          <p className="font-semibold">{course.programDuration}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-gray-700">
                        <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center text-primary">
                          <BarChart className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-bold text-sm text-gray-500 uppercase">Level</p>
                          <p className="font-semibold mb-0">Level {course.level}</p>
                        </div>
                      </div>

                      {course.programFormat && course.programFormat.length > 0 && (
                        <div className="flex items-center gap-4 text-gray-700">
                          <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center text-primary">
                            <Users className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-bold text-sm text-gray-500 uppercase">Format</p>
                            <p className="font-semibold text-sm">{course.programFormat[0]}</p>
                          </div>
                        </div>
                      )}
                    </div>


                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Enrollment Section */}
        <section className="py-16 bg-gray-50 border-t">
          <div className="container mx-auto px-4 max-w-3xl">
            <EnrollmentSection program={course} selectedCohortId={selectedCohortId} intakes={intakes} onCohortSelect={setSelectedCohortId} />
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
