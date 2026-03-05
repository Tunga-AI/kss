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
import { ArrowRight, Target, Brain, Award, Star, CheckCircle, ShieldCheck, Globe } from "lucide-react";

function ProgramGrid({ programs }: { programs: Program[] }) {
  if (programs.length === 0) {
    return <div className="text-center py-10">No programs found for this category.</div>;
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
      {programs.map((program) => (
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
      ))}
    </div>
  );
}

const quadrants = [
  {
    icon: Target,
    num: "01",
    title: "Core Selling Skills",
    intro: "The practical techniques required to engage prospects, qualify opportunities and close business.",
    items: ["Prospecting and lead generation", "Discovery and needs analysis", "Objection handling", "Negotiation and closing", "Pipeline management"],
  },
  {
    icon: Brain,
    num: "02",
    title: "Business Understanding",
    intro: "Effective sales professionals understand how their organizations create value.",
    items: ["Market segmentation", "Customer insights", "Commercial strategy", "Sales analytics", "CRM utilization"],
  },
  {
    icon: Award,
    num: "03",
    title: "Leadership Capability",
    intro: "Sales professionals must lead themselves and collaborate effectively with others.",
    items: ["Coaching and mentoring", "Cross-functional collaboration", "Performance management", "Change leadership"],
  },
  {
    icon: Star,
    num: "04",
    title: "Self-Mastery",
    intro: "Consistent performance requires strong personal discipline and professional values.",
    items: ["Resilience and motivation", "Ethical decision-making", "Personal development planning", "Adaptability and continuous learning"],
  },
];

const capabilityLevels = [
  "Foundational sales capability",
  "Frontline sales execution",
  "Advanced selling and account management",
  "Strategic sales leadership",
  "Sales capability development and training",
  "Executive sales coaching",
];

export default function CoursesPage() {
  const firestore = useUsersFirestore();
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

        {/* ── HERO ── */}
        <section className="relative min-h-screen w-full flex items-end bg-primary">
          {branding?.programsHeroUrl && (
            <Image src={branding.programsHeroUrl} alt="Programs Hero" fill className="object-cover" />
          )}
          <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/50 to-transparent" />
          <div className="relative z-10 w-full">
            <div className="container mx-auto px-4 lg:px-6 py-20 pb-16">
              <div className="grid lg:grid-cols-2 gap-16 items-center">
                <div>
                  <Card className="bg-white border-0 shadow-2xl rounded-tl-3xl rounded-br-3xl rounded-tr-none rounded-bl-none overflow-hidden">
                    <div className="bg-accent p-6 sm:p-8">
                      <p className="text-white/80 text-sm font-bold uppercase tracking-widest mb-2">For Professionals</p>
                      <h1 className="font-headline text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight">
                        The Sales Capability Framework
                      </h1>
                    </div>
                    <div className="p-6 sm:p-8 space-y-4">
                      <p className="text-base sm:text-lg text-primary/80 leading-relaxed">
                        Professional sales performance is built through structured capability development — aligned to globally recognized standards, applied within African commercial realities.
                      </p>
                      <div className="flex flex-col sm:flex-row gap-3 pt-2">
                        <Button size="lg" className="rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none bg-primary hover:bg-primary/90 text-white shadow-md transition-all" asChild>
                          <Link href="#programs">Explore Programs <ArrowRight className="ml-2 h-5 w-5" /></Link>
                        </Button>
                        <Button size="lg" variant="outline" className="rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none border-primary text-primary hover:bg-primary hover:text-white shadow-md transition-all" asChild>
                          <Link href="#framework">The Framework</Link>
                        </Button>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── PROGRAMS LISTING ── */}
        <section id="programs" className="py-16 sm:py-20 bg-gray-50">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="h-px w-8 bg-accent" />
                <span className="text-accent text-sm font-bold uppercase tracking-widest">Enroll Today</span>
                <div className="h-px w-8 bg-accent" />
              </div>
              <h2 className="font-headline text-3xl sm:text-4xl font-extrabold text-primary mb-4">Our Programs</h2>
              <p className="text-gray-500 text-lg max-w-xl mx-auto">Choose a program aligned to your career stage and capability goals.</p>
            </div>
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
                  <TabsContent value="all"><ProgramGrid programs={allCourses} /></TabsContent>
                  <TabsContent value="core"><ProgramGrid programs={coreCourses} /></TabsContent>
                  <TabsContent value="short"><ProgramGrid programs={shortCourses} /></TabsContent>
                </>
              )}
            </Tabs>
          </div>
        </section>

        {/* ── INTRODUCTION ── */}
        <section id="framework" className="py-24 bg-white">
          <div className="container mx-auto px-6">
            <div className="max-w-3xl mx-auto text-center mb-20">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="h-px w-8 bg-accent" />
                <span className="text-accent text-sm font-bold uppercase tracking-widest">The Framework</span>
                <div className="h-px w-8 bg-accent" />
              </div>
              <h2 className="font-headline text-4xl sm:text-5xl font-extrabold text-primary leading-tight mb-6">
                Structured Pathways for Sales Professionals
              </h2>
              <p className="text-gray-600 text-lg leading-relaxed mb-5">
                Professional sales performance is built through structured capability development.
              </p>
              <p className="text-gray-600 text-lg leading-relaxed mb-5">
                The Kenya School of Sales programs are aligned to the Institute of Sales Professionals (ISP) Sales Capability Framework, which defines the competencies required for sales professionals at different stages of their careers.
              </p>
              <p className="text-gray-600 text-lg leading-relaxed">
                The framework focuses not only on knowledge but on the ability to apply skills effectively in real commercial situations.
              </p>
            </div>

            <div className="text-center mb-12">
              <h3 className="font-headline text-3xl sm:text-4xl font-extrabold text-primary">The Four Capability Quadrants</h3>
            </div>
            <div className="grid md:grid-cols-2 gap-8">
              {quadrants.map((q, i) => (
                <div key={i} className="bg-gray-50 rounded-tl-3xl rounded-br-3xl p-10 group hover:shadow-lg transition-all">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-14 h-14 bg-accent/10 text-accent rounded-tl-xl rounded-br-xl flex items-center justify-center group-hover:bg-accent group-hover:text-white transition-colors">
                      <q.icon className="h-7 w-7" />
                    </div>
                    <span className="text-accent text-xs font-black uppercase tracking-widest">{q.num}</span>
                  </div>
                  <h4 className="font-headline font-bold text-xl text-primary mb-3">{q.title}</h4>
                  <p className="text-gray-600 leading-relaxed mb-4 text-sm">{q.intro}</p>
                  <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-3">Examples include:</p>
                  <ul className="space-y-2">
                    {q.items.map((item, j) => (
                      <li key={j} className="flex items-center gap-2 text-gray-600 text-sm">
                        <div className="h-1.5 w-1.5 rounded-full bg-accent shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CAPABILITY LEVELS ── */}
        <section className="py-24 bg-primary">
          <div className="container mx-auto px-6">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div className="text-white">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-px w-8 bg-accent" />
                  <span className="text-accent text-sm font-bold uppercase tracking-widest">Career Progression</span>
                </div>
                <h2 className="font-headline text-4xl sm:text-5xl font-extrabold leading-tight mb-6">
                  Capability Levels
                </h2>
                <p className="text-white/70 text-lg leading-relaxed mb-8">
                  The framework supports progression through multiple stages of sales mastery. Each level builds progressively deeper expertise in commercial execution and leadership.
                </p>
                <Button size="lg" className="rounded-tl-xl rounded-br-xl bg-accent hover:bg-accent/90 text-white h-14 px-8 font-bold shadow-lg" asChild>
                  <Link href="#programs">View Our Programs <ArrowRight className="ml-2 h-5 w-5" /></Link>
                </Button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {capabilityLevels.map((level, i) => (
                  <div key={i} className="bg-white/5 border border-white/10 rounded-tl-2xl rounded-br-2xl p-6 flex items-start gap-4 hover:bg-white/10 transition-colors group">
                    <div className="w-10 h-10 bg-accent/20 text-accent rounded-tl-lg rounded-br-lg flex items-center justify-center shrink-0 group-hover:bg-accent group-hover:text-white transition-colors text-xs font-black">
                      {String(i + 1).padStart(2, '0')}
                    </div>
                    <p className="text-white/80 font-medium text-sm leading-relaxed pt-1.5">{level}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── CERTIFICATION ── */}
        <section className="py-24 bg-white">
          <div className="container mx-auto px-6">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-px w-8 bg-accent" />
                  <span className="text-accent text-sm font-bold uppercase tracking-widest">Certification</span>
                </div>
                <h2 className="font-headline text-4xl sm:text-5xl font-extrabold text-primary leading-tight mb-6">
                  Globally Recognized Credentials
                </h2>
                <p className="text-gray-600 text-lg leading-relaxed mb-8">
                  Participants who successfully complete KSS programs receive recognized credentials that validate their professional sales capability.
                </p>
                <div className="space-y-4">
                  {[
                    { icon: ShieldCheck, label: "Kenya School of Sales Certification" },
                    { icon: Globe, label: "Digital professional credentials" },
                    { icon: CheckCircle, label: "Recognition aligned with ISP global standards" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-accent/10 text-accent rounded-tl-xl rounded-br-xl flex items-center justify-center shrink-0">
                        <item.icon className="h-6 w-6" />
                      </div>
                      <p className="text-primary font-semibold">{item.label}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-primary rounded-tl-3xl rounded-br-3xl p-12 text-center">
                <div className="flex items-center justify-center gap-3 mb-6">
                  <div className="h-px w-8 bg-accent" />
                  <span className="text-accent text-sm font-bold uppercase tracking-widest">Aligned to</span>
                  <div className="h-px w-8 bg-accent" />
                </div>
                <p className="font-headline text-4xl font-black text-white mb-3">ISP</p>
                <p className="text-white/70 font-medium mb-6">Institute of Sales Professionals<br />United Kingdom</p>
                <p className="text-white/60 text-sm leading-relaxed">
                  The ISP is the professional membership body for sales professionals, providing globally recognized standards for sales excellence and capability development.
                </p>
              </div>
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </div>
  );
}
