'use client';
import Image from "next/image";
import Link from "next/link";
import { useParams, notFound } from "next/navigation";
import { Header } from "@/components/shared/header";
import { Footer } from "@/components/shared/footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CheckCircle, Clock, BookOpen, Star, UserCheck, Monitor, Lock, Play,
  ChevronDown, ChevronUp, FileDown, Award, Globe, BarChart, ArrowRight, Check
} from "lucide-react";
import { useUsersFirestore } from "@/firebase";
import { useUser } from "@/firebase/auth/use-user";
import { collection, query, where, limit } from "firebase/firestore";
import { useCollection } from "@/firebase/firestore/use-collection";
import type { Program } from "@/lib/program-types";
import { useMemo, useState } from "react";
import { EnrollmentSection } from "@/components/enrollment/EnrollmentSection";

export default function ElearningCourseDetailPage() {
  const params = useParams();
  const slug = Array.isArray(params.id) ? params.id[0] : params.id;
  const firestore = useUsersFirestore();
  const [expandedModule, setExpandedModule] = useState<string | null>(null);
  const { user } = useUser();

  const programQuery = useMemo(() => {
    if (!firestore || !slug) return null;
    return query(collection(firestore, 'programs'), where('slug', '==', slug), limit(1));
  }, [firestore, slug]);

  const { data: programs, loading } = useCollection<Program>(programQuery as any);
  const course = useMemo(() => programs?.[0], [programs]);

  const enrollmentQuery = useMemo(() => {
    if (!firestore || !user || !course) return null;
    return query(collection(firestore, 'elearningEnrollments'), where('userId', '==', user.uid), where('programId', '==', course.id), limit(1));
  }, [firestore, user, course]);

  const { data: enrollments, loading: enrollmentLoading } = useCollection<any>(enrollmentQuery as any);
  const isEnrolled = !!(enrollments && enrollments.length > 0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-accent animate-spin" />
          <p className="text-primary/50 font-bold uppercase tracking-widest text-xs">Loading course...</p>
        </div>
      </div>
    );
  }

  if (!course || course.programType !== 'E-Learning') notFound();

  const title = course.title || course.programName;
  const description = course.description || course.shortDescription;
  const duration = (course as any).duration || course.programDuration;
  const price = course.price === 0 ? 'Free' : `${course.currency || 'KES'} ${Number(course.price).toLocaleString()}`;
  const modules = course.elearningModules || [];
  const instructors = course.instructorProfiles || [];
  const previewCount = modules.filter(m => m.isPreview).length;
  const totalDuration = modules.filter(m => m.duration).map(m => m.duration!).join(', ');

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Header />
      <main className="flex-grow">

        {/* ═══ HERO (dark) ═══════════════════════════════════════════ */}
        <section className="bg-[#1C1D1F] text-white pt-24 pb-12 lg:pt-28 lg:pb-16">
          <div className="container mx-auto px-4 md:px-8 max-w-4xl text-center">
            {/* Badges */}
            <div className="flex flex-wrap justify-center gap-3 mb-6">
              <Badge className="bg-accent text-white font-black uppercase tracking-widest text-xs rounded-sm px-3">E-Learning</Badge>
              {course.level && (
                <Badge variant="outline" className="border-white/30 text-white/80 font-bold uppercase tracking-widest rounded-full text-xs">{String(course.level)}</Badge>
              )}
              <Badge variant="outline" className="border-white/30 text-white/80 font-bold uppercase tracking-widest rounded-full text-xs flex items-center gap-1">
                <Monitor className="h-3 w-3" /> Self-Paced
              </Badge>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight mb-5">{title}</h1>
            <p className="text-lg text-white/70 mx-auto max-w-2xl">{description}</p>

            {/* Quick stats row */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-white/60 mt-8">
              {modules.length > 0 && <span className="flex items-center gap-1.5"><BookOpen className="h-4 w-4 text-accent" />{modules.length} modules</span>}
              {duration && <span className="flex items-center gap-1.5"><Clock className="h-4 w-4 text-accent" />{duration}</span>}
              <span className="flex items-center gap-1.5"><Globe className="h-4 w-4 text-accent" />English</span>
              <span className="flex items-center gap-1.5"><Award className="h-4 w-4 text-accent" />Certificate included</span>
            </div>
          </div>
        </section>

        {/* ═══ BODY ═══════════════════════════════════════════════════ */}
        <div className="container mx-auto px-4 md:px-8 max-w-7xl">
          <div className="grid lg:grid-cols-3 gap-8 lg:gap-12 py-10 lg:py-14">

            {/* ── MOBILE ENROLLMENT FORM (shows at top on mobile) ── */}
            {!isEnrolled && (
              <div className="block lg:hidden w-full mb-4" id="enroll-form-mobile">
                <CourseEnrollCard course={course} price={price} slug={slug as string} />
              </div>
            )}
            {isEnrolled && (
              <div className="block lg:hidden w-full mb-4" id="access-form-mobile">
                <CourseAccessCard slug={slug as string} />
              </div>
            )}

            {/* ── MAIN CONTENT (left 2/3) ── */}
            <div className="lg:col-span-2 space-y-10 lg:space-y-16 min-w-0">

              {/* Overview Video */}
              {course.overviewVideoUrl && (
                <section className="w-full max-w-full">
                  <div className="rounded-xl lg:rounded-2xl overflow-hidden bg-black aspect-video w-full shadow-lg lg:shadow-2xl relative group min-w-0">
                    <video
                      src={course.overviewVideoUrl}
                      controls
                      className="absolute inset-0 w-full h-full object-contain"
                      poster={course.imageUrl || course.image}
                    />
                  </div>
                </section>
              )}

              {/* What you'll learn */}
              {(course.objectives || []).length > 0 && (
                <section>
                  <SectionTitle>What you'll learn</SectionTitle>
                  <div className="border border-gray-200 rounded-xl p-6 mt-4">
                    <div className="grid sm:grid-cols-2 gap-3">
                      {(course.objectives || []).map((item, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                          <span className="text-sm text-gray-700 leading-snug">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>
              )}

              {/* Course curriculum */}
              {modules.length > 0 && (
                <section>
                  <SectionTitle>Course curriculum</SectionTitle>
                  <p className="text-gray-500 text-sm mt-2 mb-4">
                    {modules.length} modules · {previewCount} previews available
                  </p>
                  <div className="border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-200">
                    {modules.map((mod, idx) => {
                      const isOpen = expandedModule === mod.id;
                      return (
                        <div key={mod.id}>
                          {/* Module header */}
                          <button
                            type="button"
                            onClick={() => setExpandedModule(isOpen ? null : mod.id)}
                            className="w-full flex items-center gap-4 px-5 py-4 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
                          >
                            <span className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center text-xs font-black shrink-0">{idx + 1}</span>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-gray-900 text-sm truncate">{mod.title || `Module ${idx + 1}`}</p>
                              {mod.duration && <p className="text-xs text-gray-400 mt-0.5">{mod.duration}</p>}
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                              {isEnrolled ? (
                                <span className="text-[10px] font-black uppercase tracking-widest text-green-600 border border-green-600/40 bg-green-50 rounded-full px-2 py-0.5">Unlocked</span>
                              ) : mod.isPreview ? (
                                <span className="text-[10px] font-black uppercase tracking-widest text-accent border border-accent/40 rounded-full px-2 py-0.5">Preview</span>
                              ) : (
                                <Lock className="h-4 w-4 text-gray-300" />
                              )}
                              {isOpen ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
                            </div>
                          </button>

                          {/* Expanded content */}
                          {isOpen && (
                            <div className="px-5 py-4 bg-white space-y-3">
                              {mod.description && <p className="text-sm text-gray-600 leading-relaxed">{mod.description}</p>}

                              {mod.videoUrl ? (
                                isEnrolled || mod.isPreview ? (
                                  <div className="rounded-xl overflow-hidden bg-black aspect-video w-full relative group">
                                    <video
                                      src={mod.videoUrl}
                                      controls
                                      className="w-full h-full object-cover"
                                      poster={mod.thumbnailUrl}
                                    />
                                  </div>
                                ) : (
                                  <div className="relative aspect-video rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center">
                                    <div className="flex flex-col items-center gap-2 text-gray-400">
                                      <Lock className="h-8 w-8" />
                                      <p className="text-sm font-medium">Enroll to unlock this lesson</p>
                                    </div>
                                  </div>
                                )
                              ) : null}

                              {mod.materials.length > 0 && (
                                <div>
                                  <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-2">Supporting Materials</p>
                                  <div className="space-y-1">
                                    {mod.materials.map((mat, mIdx) => (
                                      isEnrolled || mod.isPreview ? (
                                        <a key={mIdx} href={mat.fileUrl} target="_blank" rel="noreferrer"
                                          className="flex items-center gap-2 text-sm text-primary hover:underline">
                                          <FileDown className="h-4 w-4 text-accent" /> {mat.name}
                                        </a>
                                      ) : (
                                        <div key={mIdx} className="flex items-center gap-2 text-sm text-gray-400">
                                          <Lock className="h-3.5 w-3.5" /> {mat.name}
                                        </div>
                                      )
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* Requirements / Certificate */}
              {(course.completionRequirements || []).length > 0 && (
                <section>
                  <SectionTitle>Certificate Requirements</SectionTitle>
                  <ul className="mt-4 space-y-3">
                    {(course.completionRequirements || []).map((req, i) => (
                      <li key={i} className="flex items-start gap-3 text-gray-700 text-sm">
                        <Award className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                        {req}
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* Who is it for */}
              {(course.whoIsItFor || []).length > 0 && (
                <section>
                  <SectionTitle>Who this course is for</SectionTitle>
                  <ul className="mt-4 space-y-3">
                    {(course.whoIsItFor || []).map((persona, i) => (
                      <li key={i} className="flex items-center gap-3 text-gray-700 text-sm">
                        <UserCheck className="h-5 w-5 text-primary/40 shrink-0" />
                        {persona}
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* Instructors */}
              {instructors.length > 0 && (
                <section>
                  <SectionTitle>Instructors</SectionTitle>
                  <div className="mt-6 space-y-8">
                    {instructors.map((inst, i) => (
                      <div key={i} className="flex gap-5">
                        <div className="w-20 h-20 rounded-full bg-primary/10 overflow-hidden shrink-0">
                          {inst.imageUrl
                            ? <img src={inst.imageUrl} alt={inst.name} className="w-full h-full object-cover" />
                            : <div className="w-full h-full flex items-center justify-center text-primary/30 text-2xl font-black">{inst.name.charAt(0)}</div>
                          }
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 text-lg">{inst.name}</p>
                          {inst.title && <p className="text-accent text-sm font-medium mb-2">{inst.title}</p>}
                          {inst.bio && <p className="text-gray-600 text-sm leading-relaxed">{inst.bio}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>

            {/* ── SIDEBAR (sticky, right 1/3, desktop only) ── */}
            <div className="hidden lg:block lg:col-span-1 min-w-0">
              <div className="sticky top-8" id="enroll-form-desktop">
                {isEnrolled ? (
                  <CourseAccessCard slug={slug as string} />
                ) : (
                  <CourseEnrollCard course={course} price={price} slug={slug as string} />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ═══ Mobile enroll bar ═══════════════════════════════════════ */}
        {!isEnrolled ? (
          <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 flex items-center justify-between gap-4 z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
            <div className="shrink-0 flex flex-col justify-center">
              <p className="text-xl sm:text-2xl font-black text-primary leading-none">{price}</p>
              <p className="text-[9px] sm:text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Lifetime access</p>
            </div>
            <Button className="h-12 px-6 sm:px-8 bg-accent hover:bg-accent/90 text-white font-bold rounded-xl flex-1 shadow-lg shadow-accent/20" asChild>
              <a href="#enroll-form-mobile">
                Enroll Now <ArrowRight className="h-4 w-4 ml-1.5" />
              </a>
            </Button>
          </div>
        ) : (
          <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 flex items-center justify-between gap-4 z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
            <Button className="h-12 w-full bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-lg shadow-green-600/20" asChild>
              <Link href={`/e-learning/${slug}/learn`}>
                Go to Course <ArrowRight className="h-4 w-4 ml-1.5" />
              </Link>
            </Button>
          </div>
        )}

      </main>
      <div className="pb-20 lg:pb-0"><Footer /></div>
    </div>
  );
}

// ─── Shared utilities ─────────────────────────────────────────────────────────
function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-2xl font-bold text-gray-900 border-b border-gray-200 pb-3">{children}</h2>;
}

function CourseEnrollCard({ course, price, slug }: { course: Program; price: string; slug: string }) {
  // We use the EnrollmentSection and pass the course to it directly
  // Adjust programType temporarily if needed to trick EnrollmentSection into not charging 'Admission Fee'
  const elearningCourseObj = {
    ...course,
    programType: 'E-Learning' as const // Ensure it's not treated as Core so it charges full price
  };

  return (
    <div className="w-full">
      <EnrollmentSection program={elearningCourseObj} />
    </div>
  );
}

function CourseAccessCard({ slug }: { slug: string }) {
  return (
    <div className="bg-white border-2 border-green-600 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 right-0 p-4 opacity-10">
        <CheckCircle className="w-32 h-32 text-green-600" />
      </div>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
          <Check className="h-6 w-6 text-green-600" />
        </div>
        <div>
          <h3 className="font-bold text-lg text-gray-900 leading-tight">You're enrolled!</h3>
          <p className="text-xs text-gray-500 font-medium">Ready when you are.</p>
        </div>
      </div>
      <div className="mt-8 mb-6">
        <p className="text-sm text-gray-600">You already have lifetime access to this course. Jump right in and start learning.</p>
      </div>
      <Button
        className="w-full h-14 bg-green-600 hover:bg-green-700 text-white font-bold text-lg rounded-xl shadow-lg shadow-green-600/20"
        asChild
      >
        <Link href={`/e-learning/${slug}/learn`}>
          Go to Course <ArrowRight className="h-5 w-5 ml-2" />
        </Link>
      </Button>
    </div>
  );
}
