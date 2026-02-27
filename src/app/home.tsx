'use client';
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import {
  ArrowRight, CheckCircle, Users, Award,
  MapPin, Trophy, BookOpen, Briefcase,
  Globe, Building2, GraduationCap, TrendingUp,
  ShieldCheck, Star, ChevronDown, Quote, Clock
} from "lucide-react";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Header } from "@/components/shared/header";
import { Footer } from "@/components/shared/footer";
import { useFirestore, useUsersFirestore } from "@/firebase";
import { collection, query, where, limit } from "firebase/firestore";
import { useCollection } from "@/firebase/firestore/use-collection";
import type { Program } from "@/lib/program-types";
import { useMemo } from "react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

/* ─────────────── Static Data ─────────────── */
const testimonials = [
  {
    name: "Kevin Mwangi",
    role: "Regional Sales Manager, Safaricom",
    avatarId: "kelvin-kuria",
    quote: "KSS gave me the frameworks that got me promoted in under a year. The instructors understand the African market deeply — this isn't imported content."
  },
  {
    name: "Olive Kamande",
    role: "Founder, Greenfields Consultancy",
    avatarId: "olive-kamande",
    quote: "I came in as someone who hated the word 'sales'. I left with a methodology I use every single day to grow my business. Transformative."
  },
  {
    name: "Alex Mahugu",
    role: "Head of Business Development, Equity Bank",
    avatarId: "alex-mahugu",
    quote: "Our entire BD team went through the KSS Corporate programme. Deal conversion went up by 40% within two quarters. ROI was undeniable."
  },
];

const stats = [
  { value: "10,000+", label: "Professionals Trained" },
  { value: "50+", label: "Expert Programs" },
  { value: "95%", label: "Alumni Satisfaction" },
  { value: "100+", label: "Corporate Partners" },
];

const methodology = [
  {
    icon: Award,
    title: "Industry Practitioners",
    desc: "Every instructor is an active sales leader — Directors, VPs, and founders who live and breathe revenue generation daily.",
  },
  {
    icon: Briefcase,
    title: "Practice-First Learning",
    desc: "We follow a 70:20:10 model. For every framework you learn, you immediately apply it to real pipeline situations.",
  },
  {
    icon: Trophy,
    title: "Career & Network Access",
    desc: "Graduation unlocks our exclusive alumni community, mentorship matching, and direct access to our 100+ corporate partners.",
  },
];

/* ─────────────── Component ─────────────── */
export default function Home() {
  const heroImage = { imageUrl: '/images/hero-home.png' };
  const aboutImage = { imageUrl: '/images/elearning-home.png' };
  const corporateImage = { imageUrl: '/images/corporate-home.png' };

  const firestore = useFirestore();
  const brandingFirestore = useUsersFirestore();
  const settingsRef = brandingFirestore ? collection(brandingFirestore, 'settings') : null;
  const { data: settings } = useCollection<any>(
    settingsRef ? query(settingsRef, where('__name__', '==', 'branding')) : null
  );
  const branding = settings?.[0];

  const coursesQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, "programs"), where("programType", "in", ["Core", "Short"]), limit(4));
  }, [firestore]);

  const moocQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, "programs"), where("programType", "==", "E-Learning"), limit(3));
  }, [firestore]);

  const eventsQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, "programs"), where("programType", "==", "Event"), limit(3));
  }, [firestore]);

  const { data: courses } = useCollection<Program>(coursesQuery as any);
  const { data: moocCourses } = useCollection<Program>(moocQuery as any);
  const { data: events } = useCollection<Program & { date?: string, time?: string, location?: string }>(eventsQuery as any);

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Header />
      <main className="flex-grow">

        {/* ── 1. HERO ── */}
        <section className="relative min-h-screen w-full flex items-end bg-primary overflow-hidden">
          {branding?.homeHeroUrl && (
            <Image
              src={branding.homeHeroUrl}
              alt="Kenya School of Sales"
              fill
              className="object-cover"
              priority
              sizes="100vw"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/50 to-transparent" />

          <div className="relative z-10 w-full">
            <div className="container mx-auto px-4 py-20 pb-16">
              <div className="max-w-xl">
                <Card className="bg-white border-0 shadow-2xl rounded-tl-3xl rounded-br-3xl rounded-tr-none rounded-bl-none overflow-hidden">
                  <div className="bg-accent p-6 sm:p-8">
                    <p className="text-white/80 text-sm font-bold uppercase tracking-widest mb-2">Kenya School of Sales</p>
                    <h1 className="font-headline text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight">
                      Where Sales Leaders Are Made.
                    </h1>
                  </div>
                  <div className="p-6 sm:p-8 space-y-5">
                    <p className="text-base sm:text-lg text-primary/80 leading-relaxed">
                      We build Africa's highest-performing commercial teams — from individual contributors to entire enterprise sales forces.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button size="lg" className="rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none bg-primary hover:bg-primary/90 text-white shadow-md transition-all w-full sm:w-auto" asChild>
                        <Link href="/programs">
                          Programs <ArrowRight className="ml-2 h-5 w-5" />
                        </Link>
                      </Button>
                      <Button size="lg" variant="outline" className="rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none border-primary text-primary hover:bg-primary hover:text-white shadow-md transition-all w-full sm:w-auto" asChild>
                        <Link href="/for-business">For Business</Link>
                      </Button>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* ── 2. STATS BAR ── */}
        <section className="bg-accent">
          <div className="container mx-auto px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-white/20">
              {stats.map((s, i) => (
                <div key={i} className="py-8 px-6 text-center text-white">
                  <p className="text-3xl sm:text-4xl font-extrabold mb-1">{s.value}</p>
                  <p className="text-sm font-medium text-white/80 uppercase tracking-wider">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 3. ABOUT ── */}
        <section id="about" className="py-24 sm:py-32 bg-white">
          <div className="container mx-auto px-6">
            <div className="grid lg:grid-cols-2 gap-16 items-center">

              {/* Image side */}
              <div className="relative order-2 lg:order-1">
                <div className="relative aspect-[4/5] rounded-tl-[3rem] rounded-br-[3rem] overflow-hidden shadow-2xl">
                  <Image
                    src={aboutImage.imageUrl}
                    alt="KSS Learning Environment"
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                  />
                  <div className="absolute inset-0 bg-primary/20 mix-blend-multiply" />
                </div>
                {/* Floating badge */}
                <div className="absolute -bottom-6 -right-4 md:-right-8 bg-primary text-white p-6 rounded-tl-2xl rounded-br-2xl shadow-2xl">
                  <p className="text-4xl font-extrabold mb-1">2.5x</p>
                  <p className="text-sm font-medium text-white/80 uppercase">Avg. Revenue Growth<br />for Our Alumni</p>
                </div>
              </div>

              {/* Copy side */}
              <div className="order-1 lg:order-2">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-px w-8 bg-accent" />
                  <span className="text-accent text-sm font-bold uppercase tracking-widest">About KSS</span>
                </div>
                <h2 className="font-headline text-4xl sm:text-5xl font-extrabold text-primary leading-tight mb-6">
                  Setting the Gold Standard<br />in Sales Education.
                </h2>
                <p className="text-lg text-gray-600 leading-relaxed mb-8">
                  Founded in Kenya, built for Africa. The Kenya School of Sales is the continent's definitive institution for sales mastery — engineering programs that bridge the gap between classroom theory and explosive real-world revenue execution.
                </p>

                <div className="space-y-5 mb-10">
                  {[
                    { icon: GraduationCap, title: "Globally Recognised Certification", desc: "Our credentials are actively sought by top employers across East and West Africa." },
                    { icon: TrendingUp, title: "Practical, Proven Frameworks", desc: "We don't teach theory for its own sake. Every module is built around habits that generate revenue." },
                    { icon: ShieldCheck, title: "Accountable Outcomes", desc: "We track our alumni's career trajectory. Our reputation depends on your real-world results." },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-4">
                      <div className="mt-1 bg-accent/10 p-2 rounded-tl-lg rounded-br-lg text-accent shrink-0">
                        <item.icon className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-primary text-base mb-0.5">{item.title}</h4>
                        <p className="text-gray-500 text-sm">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <Button className="rounded-tl-xl rounded-br-xl bg-primary hover:bg-primary/90 text-white h-12 px-8 font-bold" asChild>
                  <Link href="/about">Read Our Story <ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* ── 4. CORE PROGRAMS ── */}
        <section id="programs" className="py-24 sm:py-32 bg-gray-50">
          <div className="container mx-auto px-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-px w-8 bg-accent" />
                  <span className="text-accent text-sm font-bold uppercase tracking-widest">Open Enrollment</span>
                </div>
                <h2 className="font-headline text-4xl sm:text-5xl font-extrabold text-primary leading-tight">
                  Our Core Programs
                </h2>
                <p className="mt-3 text-gray-500 text-lg max-w-xl">
                  Structured, progressive certifications for individuals at every stage of their sales career.
                </p>
              </div>
              <Button variant="outline" className="rounded-tl-xl rounded-br-xl border-primary text-primary hover:bg-primary hover:text-white h-12 px-7 font-bold shrink-0 transition-all" asChild>
                <Link href="/courses">View All Programs <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {courses?.map((course) => (
                <Link href={`/courses/${course.slug}`} key={course.id} className="block group">
                  <div className="relative overflow-hidden h-80 rounded-tl-2xl rounded-br-2xl shadow-md group-hover:shadow-2xl transition-all duration-300 bg-primary">
                    {(course.image || course.imageUrl) && (
                      <Image
                        src={(course.image || course.imageUrl) as string}
                        alt={course.programName || course.title || ''}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

                    <div className="absolute top-4 left-4">
                      <span className={`text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-tl-md rounded-br-md ${course.programType === 'Core' ? 'bg-accent text-white' : 'bg-primary text-white'}`}>
                        {course.programType || 'Program'}
                      </span>
                    </div>

                    <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
                      <h3 className="font-headline font-bold text-xl leading-snug mb-3 group-hover:text-accent transition-colors">
                        {course.programName || course.title}
                      </h3>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-white/70 bg-white/10 px-2.5 py-1 rounded">Level {course.level}</span>
                        <span className="font-bold">{course.currency} {course.price?.toLocaleString?.()}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}

              {/* CTA tile */}
              <Link href="/courses" className="block group">
                <div className="relative h-80 rounded-tl-2xl rounded-br-2xl bg-primary flex flex-col items-center justify-center text-white shadow-md group-hover:shadow-2xl transition-all duration-300 p-8 text-center">
                  <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center mb-5 group-hover:bg-accent transition-colors">
                    <ArrowRight className="w-6 h-6" />
                  </div>
                  <p className="font-headline font-bold text-xl mb-2">See All Programs</p>
                  <p className="text-white/60 text-sm">Explore our full catalogue of certified courses.</p>
                </div>
              </Link>
            </div>
          </div>
        </section>

        {/* ── 5. CORPORATE ── */}
        <section id="corporate" className="py-24 sm:py-32 bg-primary overflow-hidden">
          <div className="container mx-auto px-6">
            <div className="grid lg:grid-cols-2 gap-16 items-center">

              {/* Copy */}
              <div className="text-white">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-px w-8 bg-accent" />
                  <span className="text-accent text-sm font-bold uppercase tracking-widest">For Enterprises</span>
                </div>
                <h2 className="font-headline text-4xl sm:text-5xl font-extrabold leading-tight mb-6">
                  Train Your Whole<br />Team. Drive Real Results.
                </h2>
                <p className="text-white/70 text-lg leading-relaxed mb-8">
                  Our Corporate Training arm works directly with organisations to design and deliver programmes aligned to your product, your market, and your revenue ambitions. No off-the-shelf content — everything is built for your context.
                </p>
                <ul className="space-y-4 mb-10">
                  {[
                    "Bespoke curriculum mapped to your products & processes",
                    "Dedicated cohort coaching and live performance tracking",
                    "Executive strategy consulting included",
                    "Post-training ROI measurement and reporting",
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-accent shrink-0" />
                      <span className="text-white/80 font-medium">{item}</span>
                    </li>
                  ))}
                </ul>
                <Button size="lg" className="rounded-tl-xl rounded-br-xl bg-accent hover:bg-accent/90 text-white h-14 px-8 font-bold shadow-lg" asChild>
                  <Link href="/for-business">Partner With Us <Building2 className="ml-2 h-5 w-5" /></Link>
                </Button>
              </div>

              {/* Image */}
              <div className="relative order-first lg:order-last">
                <div className="relative h-[480px] rounded-tl-[3rem] rounded-br-[3rem] overflow-hidden shadow-2xl">
                  <Image
                    src={corporateImage.imageUrl}
                    alt="Corporate Training Session"
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                  />
                  <div className="absolute inset-0 bg-accent/10 mix-blend-multiply" />
                </div>
                {/* floating stat */}
                <div className="absolute -bottom-6 -left-4 md:-left-8 bg-white p-6 rounded-tl-2xl rounded-br-2xl shadow-2xl">
                  <p className="text-4xl font-extrabold text-primary mb-1">40%</p>
                  <p className="text-sm font-medium text-gray-500 uppercase">Avg. Deal Conversion<br />Lift for Clients</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── 6. E-LEARNING ── */}
        <section id="elearning" className="py-24 sm:py-32 bg-white">
          <div className="container mx-auto px-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-px w-8 bg-accent" />
                  <span className="text-accent text-sm font-bold uppercase tracking-widest">Self-Paced Learning</span>
                </div>
                <h2 className="font-headline text-4xl sm:text-5xl font-extrabold text-primary leading-tight">
                  Learn on Your<br />Own Schedule.
                </h2>
                <p className="mt-3 text-gray-500 text-lg max-w-xl">
                  Access the same world-class content from our live sessions — anytime, anywhere, on any device.
                </p>
              </div>
              <Button variant="outline" className="rounded-tl-xl rounded-br-xl border-primary text-primary hover:bg-primary hover:text-white h-12 px-7 font-bold shrink-0 transition-all" asChild>
                <Link href="/e-learning">Open E-Learning Portal <Globe className="ml-2 h-4 w-4" /></Link>
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {moocCourses?.map((course) => (
                <Link href={`/e-learning/${course.slug}`} key={course.id} className="block group">
                  <div className="bg-gray-50 rounded-tl-2xl rounded-br-2xl overflow-hidden border border-gray-100 hover:border-accent/30 hover:shadow-xl transition-all duration-300">
                    <div className="relative h-52 overflow-hidden">
                      {(course.image || course.imageUrl) && (
                        <Image
                          src={(course.image || course.imageUrl) as string}
                          alt={course.programName || course.title || ''}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                          sizes="(max-width: 768px) 100vw, 33vw"
                        />
                      )}
                      <div className="absolute inset-0 bg-primary/10 group-hover:bg-transparent transition-colors" />
                      <div className="absolute top-3 left-3">
                        <span className="bg-white text-primary text-xs font-bold px-3 py-1.5 rounded shadow">
                          Level {course.level}
                        </span>
                      </div>
                    </div>
                    <div className="p-6">
                      <h3 className="font-headline font-bold text-lg text-primary line-clamp-2 mb-3 group-hover:text-accent transition-colors">
                        {course.programName || course.title}
                      </h3>
                      <div className="flex items-center gap-1 mb-4">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                        <span className="font-extrabold text-primary text-lg">
                          {course.currency} {course.price?.toLocaleString?.()}
                        </span>
                        <span className="inline-flex items-center gap-1.5 text-accent font-semibold text-sm group-hover:gap-2.5 transition-all">
                          Enroll <ArrowRight className="w-4 h-4" />
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ── 7. METHODOLOGY ── */}
        <section className="py-24 sm:py-32 bg-gray-50">
          <div className="container mx-auto px-6">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="h-px w-8 bg-accent" />
                <span className="text-accent text-sm font-bold uppercase tracking-widest">Why KSS</span>
                <div className="h-px w-8 bg-accent" />
              </div>
              <h2 className="font-headline text-4xl sm:text-5xl font-extrabold text-primary leading-tight mb-5">
                The KSS Methodology
              </h2>
              <p className="text-gray-500 text-lg">
                We didn't just build courses. We engineered a complete ecosystem for lasting commercial success.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {methodology.map((item, i) => (
                <div key={i} className="bg-white rounded-tl-3xl rounded-br-3xl p-10 border border-gray-100 shadow-sm hover:shadow-lg hover:border-accent/30 transition-all group">
                  <div className="w-14 h-14 bg-primary/10 text-primary rounded-tl-xl rounded-br-xl flex items-center justify-center mb-7 group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                    <item.icon className="h-7 w-7" />
                  </div>
                  <h3 className="font-headline text-xl font-bold text-primary mb-3">{item.title}</h3>
                  <p className="text-gray-500 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 8. EVENTS ── */}
        {events && events.length > 0 && (
          <section className="py-24 sm:py-32 bg-white">
            <div className="container mx-auto px-6">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14">
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-px w-8 bg-accent" />
                    <span className="text-accent text-sm font-bold uppercase tracking-widest">Community & Events</span>
                  </div>
                  <h2 className="font-headline text-4xl sm:text-5xl font-extrabold text-primary leading-tight">
                    Upcoming Workshops<br />& Summits
                  </h2>
                </div>
                <Button variant="outline" className="rounded-tl-xl rounded-br-xl border-primary text-primary hover:bg-primary hover:text-white h-12 px-7 font-bold shrink-0 transition-all" asChild>
                  <Link href="/events">See Full Calendar <ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {events.map((event) => (
                  <Link href={`/events/${event.slug}`} key={event.id} className="block group">
                    <div className="bg-gray-50 rounded-tl-2xl rounded-br-2xl overflow-hidden border border-gray-100 hover:border-accent/30 hover:shadow-xl transition-all duration-300 h-full flex flex-col">
                      <div className="relative h-52 overflow-hidden">
                        {(event.image || event.imageUrl) && (
                          <Image
                            src={(event.image || event.imageUrl) as string}
                            alt={event.programName || event.title || ''}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                            sizes="(max-width: 768px) 100vw, 33vw"
                          />
                        )}
                        {event.date && (
                          <div className="absolute top-4 left-4 bg-white text-primary font-bold px-3 py-2 rounded-tl-lg rounded-br-lg shadow text-center min-w-[3rem]">
                            <span className="block text-xl leading-none">{format(new Date(event.date), 'dd')}</span>
                            <span className="block text-xs uppercase tracking-wider">{format(new Date(event.date), 'MMM')}</span>
                          </div>
                        )}
                      </div>
                      <div className="p-6 flex flex-col flex-grow">
                        <div className="flex items-center gap-2 text-sm text-accent font-semibold mb-3">
                          <MapPin className="h-4 w-4 shrink-0" />
                          <span>{event.location || 'Online'}</span>
                        </div>
                        <h3 className="font-headline font-bold text-lg text-primary line-clamp-2 mb-4 group-hover:text-accent transition-colors flex-grow">
                          {event.programName || event.title}
                        </h3>
                        <div className="flex items-center justify-between pt-4 border-t border-gray-200 mt-auto">
                          <span className="flex items-center gap-1.5 text-gray-400 text-sm">
                            <Clock className="h-4 w-4" /> {event.time || 'TBA'}
                          </span>
                          <Badge className={`rounded-tl-md rounded-br-md ${event.price === 0 ? 'bg-green-100 text-green-700' : 'bg-primary/10 text-primary'} font-bold border-0`}>
                            {event.price === 0 ? 'Free' : `${event.currency || ''} ${event.price?.toLocaleString?.()}`}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── 9. TESTIMONIALS ── */}
        <section className="py-24 sm:py-32 bg-primary">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="h-px w-8 bg-accent" />
                <span className="text-accent text-sm font-bold uppercase tracking-widest">Success Stories</span>
                <div className="h-px w-8 bg-accent" />
              </div>
              <h2 className="font-headline text-4xl sm:text-5xl font-extrabold text-white leading-tight">
                Hear From Our Alumni
              </h2>
              <p className="mt-4 text-white/60 text-lg">Join thousands who have accelerated their careers with KSS.</p>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
              {testimonials.map((t) => {
                const avatar = PlaceHolderImages.find(p => p.id === t.avatarId);
                return (
                  <div key={t.name} className="bg-white/5 border border-white/10 rounded-tl-3xl rounded-br-3xl p-8 flex flex-col hover:bg-white/10 transition-colors">
                    <Quote className="h-8 w-8 text-accent/50 mb-6" />
                    <p className="text-white/80 leading-relaxed italic mb-8 flex-grow">"{t.quote}"</p>
                    <div className="flex items-center gap-4 border-t border-white/10 pt-6">
                      <Avatar className="h-12 w-12 border-2 border-accent">
                        {avatar && <AvatarImage src={avatar.imageUrl} alt={t.name} />}
                        <AvatarFallback className="bg-accent text-white font-bold">{t.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-bold text-white">{t.name}</p>
                        <p className="text-accent text-sm">{t.role}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── 10. FINAL CTA ── */}
        <section className="py-24 sm:py-32 bg-white">
          <div className="container mx-auto px-6">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="font-headline text-4xl sm:text-5xl font-extrabold text-primary leading-tight mb-6">
                Ready to Invest<br />in Your Growth?
              </h2>
              <p className="text-gray-500 text-xl leading-relaxed mb-10">
                Whether you're enrolling in our next cohort or planning a custom rollout for your team — we're ready to build your programme.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Button size="lg" className="rounded-tl-xl rounded-br-xl bg-primary hover:bg-primary/90 text-white h-14 px-10 text-base font-bold shadow-lg w-full sm:w-auto" asChild>
                  <Link href="/contact">Talk to Admissions <ArrowRight className="ml-2 h-5 w-5" /></Link>
                </Button>
                <Button size="lg" variant="outline" className="rounded-tl-xl rounded-br-xl border-primary text-primary hover:bg-primary hover:text-white h-14 px-10 text-base font-bold transition-all w-full sm:w-auto" asChild>
                  <Link href="/courses">Browse Courses <BookOpen className="ml-2 h-5 w-5" /></Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </div>
  );
}
