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
    quote: "The program helped our team rethink how we approach pipeline management and opportunity qualification."
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
    return query(collection(firestore, "programs"), where("programType", "==", "E-Learning"), limit(4));
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
            <div className="container mx-auto px-4 lg:px-6 py-20 pb-16">
              <div className="grid lg:grid-cols-2 gap-16 items-center">
                <div className="max-w-2xl">
                  <Card className="bg-white border-0 shadow-2xl rounded-tl-3xl rounded-br-3xl rounded-tr-none rounded-bl-none overflow-hidden">
                    <div className="bg-accent p-6 sm:p-8">
                      <p className="text-white/80 text-sm font-bold uppercase tracking-widest mb-2">Kenya School of Sales</p>
                      <h1 className="font-headline text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight">
                        Building Bold African Commercial Superstars
                      </h1>
                    </div>
                    <div className="p-6 sm:p-8 space-y-5">
                      <p className="text-base sm:text-lg text-primary/80 leading-relaxed mb-4">
                        We help businesses strengthen commercial execution and help professionals build the skills and credentials required to succeed in modern selling.
                      </p>
                      <div className="space-y-3 mb-4">
                        <p className="text-sm text-primary/80"><strong className="text-primary">For Businesses:</strong> Strengthen your sales execution with diagnostics, capability academies and commercial design labs.</p>
                        <p className="text-sm text-primary/80"><strong className="text-primary">For Professionals:</strong> Accelerate your career through structured programs, certifications and real-world sales capability development.</p>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-3">
                        <Button size="lg" className="rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none bg-primary hover:bg-primary/90 text-white shadow-md transition-all w-full sm:w-auto" asChild>
                          <Link href="/for-business">For Business</Link>
                        </Button>
                        <Button size="lg" variant="outline" className="rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none border-primary text-primary hover:bg-primary hover:text-white shadow-md transition-all w-full sm:w-auto" asChild>
                          <Link href="/courses">Explore Programs <ArrowRight className="ml-2 h-5 w-5" /></Link>
                        </Button>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── 2. CREDIBILITY BAR ── */}
        <section className="bg-accent py-6">
          <div className="container mx-auto px-6 text-center">
            <p className="text-white text-lg font-medium">
              Developed as a division of the Commercial Club of Africa and aligned to the Institute of Sales Professionals (ISP), UK.
            </p>
          </div>
        </section>

        {/* ── 3. THE COMMERCIAL REALITY ── */}
        <section id="about" className="py-24 sm:py-32 bg-white overflow-hidden">
          <div className="container mx-auto px-6">
            <div className="grid lg:grid-cols-2 gap-16 items-center">

              {/* Copy side */}
              <div className="text-primary">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-px w-8 bg-accent" />
                  <span className="text-accent text-sm font-bold uppercase tracking-widest">The Commercial Reality</span>
                </div>
                <h2 className="font-headline text-4xl sm:text-5xl font-extrabold leading-tight mb-6">
                  Sales Performance Requires More Than Training
                </h2>
                <p className="text-gray-600 text-lg leading-relaxed mb-5">
                  Many businesses struggle with stalled pipelines, inconsistent sales execution and unclear commercial processes. These challenges often stem from systemic issues rather than individual skill gaps.
                </p>
                <p className="text-gray-600 text-lg leading-relaxed mb-5">
                  At the same time, sales professionals increasingly need structured career pathways to build capability and remain competitive in modern commercial environments.
                </p>
                <p className="text-gray-600 text-lg leading-relaxed mb-8">
                  The Kenya School of Sales addresses both challenges through a diagnostic-led approach to commercial capability development, combining structured learning pathways with real-world sales execution frameworks.
                </p>
                <Button size="lg" className="rounded-tl-xl rounded-br-xl bg-primary hover:bg-primary/90 text-white h-14 px-8 font-bold shadow-lg" asChild>
                  <Link href="/about">Learn More <ArrowRight className="ml-2 h-5 w-5" /></Link>
                </Button>
              </div>

              {/* Image side */}
              <div className="relative order-first lg:order-last">
                <div className="relative h-[480px] rounded-tl-[3rem] rounded-br-[3rem] overflow-hidden shadow-2xl">
                  <Image
                    src={aboutImage.imageUrl}
                    alt="KSS Learning Environment"
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                  />
                  <div className="absolute inset-0 bg-primary/20 mix-blend-multiply" />
                </div>
                {/* floating stat */}
                <div className="absolute -bottom-6 -left-4 md:-left-8 bg-primary p-6 rounded-tl-2xl rounded-br-2xl shadow-2xl">
                  <p className="text-4xl font-extrabold text-white mb-1">ISP</p>
                  <p className="text-sm font-medium text-white/70 uppercase">Globally Aligned<br />Curriculum</p>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ── 4. CORE PROGRAMS ── */}
        <section id="programs" className="py-24 sm:py-32 bg-gray-50">
          <div className="container mx-auto px-6">
            <div className="grid lg:grid-cols-12 gap-10 lg:gap-16 items-center">

              {/* Left Side: Image with Content Overlay */}
              <div className="lg:col-span-5 relative h-[500px] lg:h-[680px] rounded-tl-[3rem] rounded-br-[3rem] overflow-hidden shadow-2xl flex flex-col p-8 sm:p-12 group order-1">
                <Image
                  src={aboutImage.imageUrl}
                  alt="Our Programs"
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-primary/95 via-primary/40 to-primary/90 mix-blend-multiply" />
                <div className="absolute inset-0 bg-gradient-to-b from-primary/80 via-transparent to-primary/80" />

                <div className="relative z-10 text-white flex flex-col justify-between h-full">
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="h-px w-8 bg-accent" />
                      <span className="text-accent text-sm font-bold uppercase tracking-widest">Our Programs</span>
                    </div>
                    <h2 className="font-headline text-3xl sm:text-4xl lg:text-4xl xl:text-5xl font-extrabold leading-tight mb-4">
                      Structured Learning Pathways for Sales Professionals
                    </h2>
                    <p className="text-white/80 text-lg max-w-sm">
                      Programs aligned to the ISP Sales Capability Framework, providing globally benchmarked professional development grounded in African commercial realities.
                    </p>
                  </div>
                  <div>
                    <Button size="lg" className="rounded-tl-xl rounded-br-xl bg-accent hover:bg-accent/90 text-white h-14 px-8 font-bold w-full sm:w-auto shadow-lg" asChild>
                      <Link href="/courses">Explore Programs <ArrowRight className="ml-2 h-5 w-5" /></Link>
                    </Button>
                  </div>
                </div>
              </div>

              {/* Right Side: 2x2 Grid of Programs */}
              <div className="lg:col-span-7 order-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
                {courses?.map((course) => (
                  <Link href={`/courses/${course.slug}`} key={course.id} className="block group">
                    <div className="relative overflow-hidden h-80 rounded-tl-2xl rounded-br-2xl shadow-md group-hover:shadow-xl transition-all duration-300 bg-primary">
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
              </div>
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
                  <span className="text-accent text-sm font-bold uppercase tracking-widest">Corporate Capability Solutions</span>
                </div>
                <h2 className="font-headline text-4xl sm:text-5xl font-extrabold leading-tight mb-6">
                  Helping Organizations Strengthen Commercial Execution
                </h2>
                <p className="text-white/70 text-lg leading-relaxed mb-8">
                  We partner with organizations to diagnose commercial challenges, define execution frameworks and develop high-performing sales teams.
                </p>
                <div className="space-y-4 mb-10">
                  <h3 className="font-bold text-lg mb-2 text-white">Solutions include:</h3>
                  {[
                    { title: "Diagnostics", desc: "Structured assessments that identify gaps in pipeline management, leadership capability and sales process clarity." },
                    { title: "Sales Playbooks", desc: "Codifying the organization’s Way of Selling." },
                    { title: "Capability Academies", desc: "Developing frontline sellers, managers and commercial leaders." },
                    { title: "Commercial Execution Lab", desc: "Facilitated sessions to address systemic commercial challenges." },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-accent shrink-0 mt-1" />
                      <p className="text-white/80 font-medium text-sm">
                        <strong className="text-white">{item.title}:</strong> {item.desc}
                      </p>
                    </div>
                  ))}
                </div>
                <Button size="lg" className="rounded-tl-xl rounded-br-xl bg-accent hover:bg-accent/90 text-white h-14 px-8 font-bold shadow-lg" asChild>
                  <Link href="/for-business">Work with Us <Building2 className="ml-2 h-5 w-5" /></Link>
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
            <div className="grid lg:grid-cols-12 gap-10 lg:gap-16 items-center">

              {/* Left Side: Image with Content Overlay */}
              <div className="lg:col-span-5 relative h-[500px] lg:h-[680px] rounded-tl-[3rem] rounded-br-[3rem] overflow-hidden shadow-2xl flex flex-col p-8 sm:p-12 group order-1">
                <Image
                  src={aboutImage.imageUrl}
                  alt="The KSS Digital Campus"
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-primary/95 via-primary/40 to-primary/90 mix-blend-multiply" />
                <div className="absolute inset-0 bg-gradient-to-b from-primary/80 via-transparent to-primary/80" />

                <div className="relative z-10 text-white flex flex-col justify-between h-full">
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="h-px w-8 bg-accent" />
                      <span className="text-accent text-sm font-bold uppercase tracking-widest">The KSS Digital Campus</span>
                    </div>
                    <h2 className="font-headline text-3xl sm:text-4xl lg:text-4xl xl:text-5xl font-extrabold leading-tight mb-4">
                      Learning That Extends Beyond the Classroom
                    </h2>
                    <p className="text-white/80 text-lg mb-4 max-w-sm">
                      Participants access learning resources, assignments, assessments and digital credentials through the KSS Digital Campus.
                    </p>
                    <ul className="space-y-2 mb-8 text-white/90 font-medium">
                      <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-accent" /> Learning management system</li>
                      <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-accent" /> Capstone project assessments</li>
                      <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-accent" /> Digital credentials and badges</li>
                      <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-accent" /> Ongoing professional resources</li>
                    </ul>
                  </div>
                  <div>
                    <Button size="lg" className="rounded-tl-xl rounded-br-xl bg-accent hover:bg-accent/90 text-white h-14 px-8 font-bold w-full sm:w-auto shadow-lg" asChild>
                      <Link href="/e-learning">Explore the Campus <Globe className="ml-2 h-5 w-5" /></Link>
                    </Button>
                  </div>
                </div>
              </div>

              {/* Right Side: Grid of E-Learning Courses */}
              <div className="lg:col-span-7 order-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
                {moocCourses?.map((course) => (
                  <Link href={`/e-learning/${course.slug}`} key={course.id} className="block group">
                    <div className="relative overflow-hidden h-80 rounded-tl-2xl rounded-br-2xl shadow-md group-hover:shadow-xl transition-all duration-300 bg-primary">
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
                        <span className="bg-accent text-white text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-tl-md rounded-br-md">
                          E-Learning
                        </span>
                      </div>

                      <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
                        <h3 className="font-headline font-bold text-xl leading-snug mb-3 group-hover:text-accent transition-colors">
                          {course.programName || course.title}
                        </h3>
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                            ))}
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-white/70 bg-white/10 px-2.5 py-1 rounded">Level {course.level}</span>
                            <span className="font-bold">{course.currency} {course.price?.toLocaleString?.()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── 7. METHODOLOGY ── */}
        <section className="py-24 sm:py-32 bg-gray-50">
          <div className="container mx-auto px-6">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="h-px w-8 bg-accent" />
                <span className="text-accent text-sm font-bold uppercase tracking-widest">The KSS Method</span>
                <div className="h-px w-8 bg-accent" />
              </div>
              <h2 className="font-headline text-4xl sm:text-5xl font-extrabold text-primary leading-tight mb-5">
                How We Build Commercial Capability
              </h2>
              <p className="text-gray-500 text-lg">
                Our methodology ensures sales capability is developed within a clear commercial operating framework.
              </p>
            </div>

            {/* Visual Flow Textual Representation */}
            <div className="flex flex-col md:flex-row items-center justify-center gap-4 mb-16 px-4">
              {['Diagnostic', 'Sales Playbook', 'Capability Development', 'Field Application', 'Measured Results'].map((step, idx, arr) => (
                <div key={idx} className="flex flex-col md:flex-row items-center gap-4">
                  <div className="bg-primary text-white text-sm font-bold px-4 py-2 rounded-full shadow-md text-center">
                    {step}
                  </div>
                  {idx < arr.length - 1 && <ArrowRight className="text-accent w-5 h-5 hidden md:block" />}
                  {idx < arr.length - 1 && <div className="h-4 w-px bg-accent md:hidden" />}
                </div>
              ))}
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                { icon: ShieldCheck, title: "Diagnostics", desc: "Identify structural gaps in commercial execution." },
                { icon: BookOpen, title: "Sales Playbooks", desc: "Define your organization’s “Way of Selling”." },
                { icon: Users, title: "Capability Academies", desc: "Build the skills and discipline required to execute consistently." },
                { icon: Briefcase, title: "Field Application", desc: "Participants apply learning through real-world sales projects." },
                { icon: Trophy, title: "Measured Results", desc: "Performance improvements are tracked through structured evaluation." }
              ].map((item, i) => (
                <div key={i} className="bg-white rounded-tl-3xl rounded-br-3xl p-8 border border-gray-100 shadow-sm hover:shadow-lg hover:border-accent/30 transition-all group">
                  <div className="w-12 h-12 bg-primary/10 text-primary rounded-tl-xl rounded-br-xl flex items-center justify-center mb-5 group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                    <item.icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-headline text-xl font-bold text-primary mb-2">{item.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
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
                    <span className="text-accent text-sm font-bold uppercase tracking-widest">Masterclasses & Events</span>
                  </div>
                  <h2 className="font-headline text-4xl sm:text-5xl font-extrabold text-primary leading-tight">
                    Industry Conversations That Shape the Future of Sales
                  </h2>
                  <p className="mt-3 text-gray-500 text-lg max-w-2xl">
                    KSS hosts masterclasses, executive forums and industry events bringing together commercial leaders and sales professionals to share insights and best practices.
                  </p>
                  <ul className="mt-4 flex flex-wrap gap-3">
                    {["AI in sales", "Commercial strategy", "Sales leadership", "Market expansion"].map((topic, i) => (
                      <li key={i} className="bg-gray-100 text-primary text-sm font-semibold px-3 py-1 rounded-full">{topic}</li>
                    ))}
                  </ul>
                </div>
                <Button variant="outline" className="rounded-tl-xl rounded-br-xl border-primary text-primary hover:bg-primary hover:text-white h-12 px-7 font-bold shrink-0 transition-all" asChild>
                  <Link href="/events">View Upcoming Events <ArrowRight className="ml-2 h-4 w-4" /></Link>
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
                Impact Across Sales Teams and Professionals
              </h2>
              <p className="mt-4 text-white/60 text-lg">Corporate case studies, participant testimonials, program outcomes, and sales leaders who have gone through KSS.</p>
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
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="font-headline text-4xl sm:text-5xl font-extrabold text-primary leading-tight mb-6">
                Start Your Sales Capability Journey
              </h2>
              <div className="grid md:grid-cols-2 gap-8 text-left mt-10">
                <div className="bg-gray-50 p-8 rounded-tl-3xl rounded-br-3xl border border-gray-100 flex flex-col">
                  <h3 className="font-bold font-headline text-2xl text-primary mb-3">For Businesses</h3>
                  <p className="text-gray-500 mb-8 flex-grow">
                    Schedule a discovery call to explore how diagnostics and capability programs can strengthen your commercial performance.
                  </p>
                  <Button size="lg" className="rounded-tl-xl rounded-br-xl bg-primary hover:bg-primary/90 text-white shadow-lg w-full" asChild>
                    <Link href="/for-business">Book a Discovery Call <ArrowRight className="ml-2 h-5 w-5" /></Link>
                  </Button>
                </div>
                <div className="bg-gray-50 p-8 rounded-tl-3xl rounded-br-3xl border border-gray-100 flex flex-col">
                  <h3 className="font-bold font-headline text-2xl text-primary mb-3">For Professionals</h3>
                  <p className="text-gray-500 mb-8 flex-grow">
                    Apply to join a structured program and advance your career in professional sales.
                  </p>
                  <Button size="lg" variant="outline" className="rounded-tl-xl rounded-br-xl border-primary text-primary hover:bg-primary hover:text-white transition-all w-full" asChild>
                    <Link href="/courses">Apply to Join <ArrowRight className="ml-2 h-5 w-5" /></Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </div>
  );
}
