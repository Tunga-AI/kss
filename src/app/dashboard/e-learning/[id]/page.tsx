'use client';
import Image from "next/image";
import { useParams, notFound, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, Clock, BarChart, ArrowLeft, PlayCircle, Lock, BookOpen, ChevronRight } from "lucide-react";
import { useFirestore, useUser } from "@/firebase";
import { collection, query, where, limit, orderBy } from "firebase/firestore";
import { useCollection } from "@/firebase/firestore/use-collection";
import type { Program } from "@/lib/program-types";
import type { LearningCourse, LearningUnit } from "@/lib/learning-types";
import type { Transaction } from '@/lib/transactions-types';
import { useMemo } from "react";
import { ProgramRegistration } from "@/components/payments/ProgramRegistration";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function LearnerElearningDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = Array.isArray(params.id) ? params.id[0] : params.id;

  const { user, loading: userLoading } = useUser();
  const firestore = useFirestore();

  // 1. Fetch Program by Slug
  const programQuery = useMemo(() => {
    if (!firestore || !slug) return null;
    return query(collection(firestore, 'programs'), where('slug', '==', slug), limit(1));
  }, [firestore, slug]);

  const { data: programs, loading: programsLoading } = useCollection<Program>(programQuery as any);
  const program = programs?.[0];

  // 2. Fetch Associated Learning Course
  const courseQuery = useMemo(() => {
    if (!firestore || !program) return null;
    return query(collection(firestore, 'learningCourses'), where('programId', '==', program.id), limit(1));
  }, [firestore, program]);

  const { data: courses, loading: coursesLoading } = useCollection<LearningCourse>(courseQuery as any);
  const course = courses?.[0];

  // 3. Fetch Units for the Course
  const unitsQuery = useMemo(() => {
    if (!firestore || !course) return null;
    return query(collection(firestore, 'learningUnits'), where('courseId', '==', course.id), orderBy('orderIndex', 'asc'));
  }, [firestore, course]);

  const { data: units, loading: unitsLoading } = useCollection<LearningUnit>(unitsQuery as any);

  // 4. Check Enrollment (LearnerEnrollments)
  const enrollmentsQuery = useMemo(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'learnerEnrollments'), where('learnerId', '==', user.uid), where('status', 'in', ['Active', 'Completed'])); // Check for active enrollments
  }, [firestore, user]);

  const { data: enrollments, loading: enrollmentsLoading } = useCollection<any>(enrollmentsQuery);

  const isEnrolled = useMemo(() => {
    if (!program || !enrollments) return false;
    // Check if user has an enrollment for this program or course
    return enrollments.some((e: any) => e.programId === program.id || (course && e.courseId === course.id));
  }, [program, course, enrollments]);

  const loading = userLoading || programsLoading || coursesLoading || enrollmentsLoading || unitsLoading;

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-8">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-8 w-48" />
        </div>
        <Skeleton className="h-96 w-full rounded-2xl" />
        <div className="grid md:grid-cols-3 gap-8">
          <Skeleton className="md:col-span-2 h-64 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  if (!program) {
    return notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20 font-body">
      {/* Hero Section */}
      <div className="relative h-[400px] w-full bg-slate-900 overflow-hidden">
        {program.imageUrl ? (
          <Image
            src={program.imageUrl}
            alt={program.title}
            fill
            className="object-cover opacity-60"
            priority
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/80 to-accent/50" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

        <div className="absolute inset-0 container mx-auto px-6 flex flex-col justify-end pb-12">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="text-white/80 hover:text-white hover:bg-white/10 w-fit mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Browse
          </Button>

          <div className="max-w-3xl">
            <div className="flex items-center gap-3 mb-4">
              <Badge className="bg-accent text-white border-none px-3 py-1 text-xs font-bold uppercase tracking-widest rounded-tl-lg rounded-br-lg">
                {program.programType || 'Course'}
              </Badge>
              <Badge variant="outline" className="text-white border-white/20 px-3 py-1 text-xs font-bold uppercase tracking-widest rounded-tl-lg rounded-br-lg bg-black/20 backdrop-blur-sm">
                {course?.level || 'All Levels'}
              </Badge>
            </div>
            <h1 className="font-headline text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
              {program.title}
            </h1>
            <p className="text-lg text-gray-300 line-clamp-2 max-w-2xl">
              {program.description}
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 -mt-10 relative z-10">
        <div className="grid md:grid-cols-3 gap-8">

          {/* Main Content */}
          <div className="md:col-span-2 space-y-8">
            {/* Overview */}
            <Card className="border-none shadow-lg rounded-2xl overflow-hidden">
              <CardHeader className="border-b bg-white">
                <CardTitle className="font-headline text-2xl font-bold text-primary">About this Course</CardTitle>
              </CardHeader>
              <CardContent className="p-8 bg-white/80 backdrop-blur-sm">
                <div className="prose prose-slate max-w-none text-gray-600">
                  <p>{program.description}</p>
                </div>

                {program.takeaways && program.takeaways.length > 0 && (
                  <div className="mt-8">
                    <h3 className="font-bold text-lg text-primary mb-4 uppercase tracking-wide text-xs">What you'll learn</h3>
                    <div className="grid sm:grid-cols-2 gap-4">
                      {program.takeaways.map((takeaway, index) => (
                        <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100">
                          <CheckCircle className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                          <span className="text-sm font-medium text-gray-700">{takeaway}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Curriculum Preview */}
            {course && (
              <Card className="border-none shadow-lg rounded-2xl overflow-hidden">
                <CardHeader className="border-b bg-white flex flex-row justify-between items-center">
                  <div>
                    <CardTitle className="font-headline text-2xl font-bold text-primary">Curriculum</CardTitle>
                    <CardDescription className="font-medium text-gray-500 mt-1">
                      {units?.length || 0} Modules • Self-Paced
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="p-0 bg-white">
                  <div className="divide-y divide-gray-100">
                    {units && units.length > 0 ? (
                      units.map((unit, index) => (
                        <div
                          key={unit.id}
                          className={cn(
                            "p-4 flex items-center justify-between group transition-colors",
                            isEnrolled ? "hover:bg-gray-50 cursor-pointer" : "opacity-80"
                          )}
                        >
                          <div className="flex items-center gap-4">
                            <div className={cn(
                              "h-10 w-10 flex items-center justify-center rounded-full font-bold text-sm",
                              isEnrolled ? "bg-primary/10 text-primary" : "bg-gray-100 text-gray-400"
                            )}>
                              {index + 1}
                            </div>
                            <div>
                              <h4 className={cn(
                                "font-bold text-sm",
                                isEnrolled ? "text-primary" : "text-gray-600"
                              )}>
                                {unit.title}
                              </h4>
                              <p className="text-xs text-gray-400">
                                {unit.estimatedDuration} mins • {unit.contentIds?.length || 0} Topics
                              </p>
                            </div>
                          </div>
                          <div>
                            {isEnrolled ? (
                              <Link href={`/dashboard/curriculum/${course.id}?unit=${unit.id}`}>
                                <PlayCircle className="h-5 w-5 text-accent opacity-0 group-hover:opacity-100 transition-opacity" />
                              </Link>
                            ) : (
                              <Lock className="h-4 w-4 text-gray-300" />
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center text-gray-500 italic">
                        Curriculum details coming soon.
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar / Enrollment */}
          <div className="space-y-6">
            <Card className="border-none shadow-xl rounded-2xl overflow-hidden sticky top-6">
              <CardHeader className="bg-primary text-white p-6 text-center">
                <CardTitle className="text-sm font-bold uppercase tracking-widest opacity-80 mb-2">
                  {isEnrolled ? 'Ready to Learn?' : 'Enrollment Status'}
                </CardTitle>
                <div className="text-3xl font-black">
                  {!program.price || program.price === 'Free' || program.price === '0' || isEnrolled ? 'Free Access' : `KES ${program.price}`}
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-6 bg-white">
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="h-4 w-4" /> Duration
                    </span>
                    <span className="font-bold text-sm text-primary">{program.duration || 'Flexible'}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="flex items-center gap-2 text-sm text-gray-600">
                      <BarChart className="h-4 w-4" /> Level
                    </span>
                    <span className="font-bold text-sm text-primary">{course?.level || 'All Levels'}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="flex items-center gap-2 text-sm text-gray-600">
                      <BookOpen className="h-4 w-4" /> Format
                    </span>
                    <span className="font-bold text-sm text-primary">Online / Self-Paced</span>
                  </div>
                </div>

                {isEnrolled && course ? (
                  <Button
                    size="lg"
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-bold h-14 text-lg shadow-lg hover:shadow-xl transition-all rounded-xl"
                    asChild
                  >
                    <Link href={`/dashboard/curriculum/${course.id}`}>
                      Start Learning <PlayCircle className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                ) : (
                  <div className="space-y-3">
                    <ProgramRegistration
                      program={program}
                      customRedirectUrl={`/dashboard/e-learning/${program.slug}`}
                    />
                    <p className="text-xs text-center text-gray-400">
                      Secure payment via Stripe / M-Pesa
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
