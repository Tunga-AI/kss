'use client';
import Image from "next/image";
import Link from "next/link";
import { Header } from "@/components/shared/header";
import { Footer } from "@/components/shared/footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { useUsersFirestore } from "@/firebase";
import { collection, query, where } from "firebase/firestore";
import { useCollection } from "@/firebase/firestore/use-collection";
import {
  ArrowRight, Check, Handshake, TrendingUp,
  Lightbulb, Users, Globe, ShieldCheck, GraduationCap,
  Target, Quote, Brain, BookOpen, Award, Star
} from "lucide-react";

/* ── Static Data ── */
const team = [
  { name: "Kelvin Kuria", role: "Co-Founder & CEO", bio: "Kelvin has spent over a decade building sales teams across East Africa. He co-founded KSS to create the continent's first structured pathway for sales professionals.", imageId: "kelvin-kuria" },
  { name: "Olive Kamande", role: "Co-Founder & COO", bio: "Olive leads operations and curriculum design. Her passion is making world-class sales education accessible to every African professional, regardless of background.", imageId: "olive-kamande" },
  { name: "Alex Mahugu", role: "General Manager", bio: "Alex bridges the gap between corporates and KSS. He manages partnerships, enterprise training programmes, and ensures every client gets measurable results.", imageId: "alex-mahugu" },
  { name: "Terence Odhiambo", role: "Commercial Lead", bio: "Terence drives KSS's commercial partnerships and business development agenda, connecting organisations across East Africa with the right capability solutions.", imageId: "terence-odhiambo" },
  { name: "Stephen Gathiru", role: "Programme Director", bio: "Stephen oversees the design and delivery of KSS programmes, ensuring every learning experience meets the highest standards of practical relevance and professional rigour.", imageId: "stephen-gathiru" },
];

const partners = [
  { name: "Yusudi", imageId: "yusudi-logo", founded: 2015, description: "Pioneered sales enablement in Africa, transforming sales into a respected career path and revolutionising how companies manage their commercial teams." },
  { name: "Commercial Club of Africa", imageId: "cca-logo", founded: 2024, description: "A platform of senior sales leaders shaping the future of African commerce through collaboration, research, and shared best practice." },
];

const values = [
  { icon: Target, title: "Results Obsessed", desc: "Every programme is designed with one goal: measurable improvement in your revenue performance." },
  { icon: Globe, title: "Africa First", desc: "Global frameworks, contextualised for the African market. We don't import solutions — we engineer them here." },
  { icon: ShieldCheck, title: "Professional Standards", desc: "Aligned to UK Institute of Sales Professionals and recognised internationally." },
  { icon: GraduationCap, title: "Lifelong Growth", desc: "We walk with our alumni long after graduation — through mentorship, community, and continued access to content." },
];

const reasons = [
  { stat: "10k+", label: "Professionals Trained" },
  { stat: "95%", label: "Alumni Satisfaction" },
  { stat: "100+", label: "Corporate Partners" },
  { stat: "5", label: "Programme Levels" },
];

/* ── Component ── */
export default function AboutPage() {
  const aboutImage = PlaceHolderImages.find(p => p.id === 'framework-hero');
  const workshopImage = PlaceHolderImages.find(p => p.id === 'event-workshop-calling');
  const conferenceImage = PlaceHolderImages.find(p => p.id === 'event-conference-summit');

  const firestore = useUsersFirestore();
  const settingsRef = firestore ? collection(firestore, 'settings') : null;
  const { data: settings } = useCollection<any>(
    settingsRef ? query(settingsRef, where('__name__', '==', 'branding')) : null
  );
  const branding = settings?.[0];

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Header />
      <main className="flex-grow">

        {/* ── HERO ── */}
        <section className="relative min-h-screen w-full flex items-end bg-primary overflow-hidden">
          {branding?.aboutHeroUrl && (
            <Image
              src={branding.aboutHeroUrl}
              alt="About KSS"
              fill
              className="object-cover"
              priority
              sizes="100vw"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/50 to-transparent" />
          <div className="relative z-10 w-full">
            <div className="container mx-auto px-4 lg:px-6 py-20 pb-16">
              <div className="max-w-4xl">
                <Card className="bg-white border-0 shadow-2xl rounded-tl-3xl rounded-br-3xl rounded-tr-none rounded-bl-none overflow-hidden">
                  <div className="bg-accent p-6 sm:p-8">
                    <p className="text-white/80 text-sm font-bold uppercase tracking-widest mb-2">About Us</p>
                    <h1 className="font-headline text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight">
                      Elevating Sales. Empowering Professionals.
                    </h1>
                  </div>
                  <div className="p-6 sm:p-8 space-y-4">
                    <p className="text-base sm:text-lg text-primary/80 leading-relaxed">
                      Kenya's first professional sales school, dedicated to transforming careers and building Africa's commercial future.
                    </p>
                    <Button size="lg" className="rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none bg-primary hover:bg-primary/90 text-white shadow-md transition-all" asChild>
                      <Link href="/courses">Explore Courses <ArrowRight className="ml-2 h-5 w-5" /></Link>
                    </Button>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* ── MISSION & VISION ── */}
        <section className="py-24 bg-white">
          <div className="container mx-auto px-6">
            <div className="grid lg:grid-cols-2 gap-0 rounded-tl-3xl rounded-br-3xl overflow-hidden shadow-2xl">
              {/* Mission */}
              <div className="bg-primary text-white p-12">
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-px w-8 bg-accent" />
                  <span className="text-accent text-sm font-bold uppercase tracking-widest">Our Mission</span>
                </div>
                <h2 className="font-headline text-3xl sm:text-4xl font-extrabold leading-tight mb-6">
                  Making Sales Training Desirable.
                </h2>
                <p className="text-white/70 text-lg leading-relaxed">
                  We believe sales is one of the most powerful career paths on the continent — yet it's historically been undervalued and under-taught. Our mission is to change that forever.
                </p>
              </div>
              {/* Vision */}
              <div className="bg-accent text-white p-12">
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-px w-8 bg-white/50" />
                  <span className="text-white/80 text-sm font-bold uppercase tracking-widest">Our Vision</span>
                </div>
                <h2 className="font-headline text-3xl sm:text-4xl font-extrabold leading-tight mb-6">
                  Nurturing African Commercial Superstars.
                </h2>
                <p className="text-white/80 text-lg leading-relaxed">
                  To produce bold, skilled, and principled commercial leaders who drive Africa's economic transformation from the front line of every business.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── WHY KSS ── */}
        <section className="py-24 bg-white">
          <div className="container mx-auto px-6">

            {/* Opening Statement */}
            <div className="max-w-3xl mx-auto text-center mb-20">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="h-px w-8 bg-accent" />
                <span className="text-accent text-sm font-bold uppercase tracking-widest">Why the Kenya School of Sales</span>
                <div className="h-px w-8 bg-accent" />
              </div>
              <h2 className="font-headline text-4xl sm:text-5xl font-extrabold text-primary leading-tight mb-6">
                Built to Close the Capability Gap
              </h2>
              <p className="text-gray-600 text-lg leading-relaxed mb-5">
                Sales capability development has traditionally focused on short training programs that improve knowledge but rarely change commercial outcomes.
              </p>
              <p className="text-gray-600 text-lg leading-relaxed mb-5">
                The Kenya School of Sales was established to address this gap by building a structured, diagnostic-led approach to commercial capability development across Africa.
              </p>
              <p className="text-gray-600 text-lg leading-relaxed">
                Our model integrates diagnostics, playbooks, capability development and measurable performance outcomes to help organizations and professionals build sustainable sales excellence.
              </p>
            </div>

            {/* What Makes KSS Different */}
            <div className="mb-20">
              <div className="text-center mb-12">
                <h3 className="font-headline text-3xl sm:text-4xl font-extrabold text-primary">What Makes KSS Different</h3>
              </div>
              <div className="grid md:grid-cols-2 gap-8">

                {/* Diagnostic-Led */}
                <div className="bg-gray-50 rounded-tl-3xl rounded-br-3xl p-10">
                  <div className="w-14 h-14 bg-accent/10 text-accent rounded-tl-xl rounded-br-xl flex items-center justify-center mb-6">
                    <Target className="h-7 w-7" />
                  </div>
                  <h4 className="font-headline font-bold text-xl text-primary mb-3">Diagnostic-Led Engagement</h4>
                  <p className="text-gray-600 leading-relaxed mb-3">
                    Most training providers begin with workshops. We begin with understanding how an organization sells.
                  </p>
                  <p className="text-gray-500 text-sm leading-relaxed">
                    Our diagnostics examine pipeline discipline, sales processes, leadership capability and field execution habits to identify the structural drivers of performance.
                  </p>
                </div>

                {/* Practitioners as Trainers */}
                <div className="bg-gray-50 rounded-tl-3xl rounded-br-3xl p-10">
                  <div className="w-14 h-14 bg-accent/10 text-accent rounded-tl-xl rounded-br-xl flex items-center justify-center mb-6">
                    <Users className="h-7 w-7" />
                  </div>
                  <h4 className="font-headline font-bold text-xl text-primary mb-3">Practitioners as Trainers</h4>
                  <p className="text-gray-600 leading-relaxed mb-3">
                    All KSS programs are facilitated by experienced commercial leaders who have built teams, managed territories and closed complex deals.
                  </p>
                  <p className="text-gray-500 text-sm leading-relaxed">
                    Participants benefit from practical insights grounded in real business environments rather than purely academic instruction.
                  </p>
                </div>

                {/* Global Standards */}
                <div className="bg-gray-50 rounded-tl-3xl rounded-br-3xl p-10">
                  <div className="w-14 h-14 bg-accent/10 text-accent rounded-tl-xl rounded-br-xl flex items-center justify-center mb-6">
                    <Globe className="h-7 w-7" />
                  </div>
                  <h4 className="font-headline font-bold text-xl text-primary mb-3">Global Standards with Local Relevance</h4>
                  <p className="text-gray-600 leading-relaxed mb-3">
                    Programs are aligned to the Institute of Sales Professionals (ISP), UK Sales Capability Framework, ensuring participants develop globally recognized competencies.
                  </p>
                  <p className="text-gray-500 text-sm leading-relaxed">
                    Applied within African commercial realities so that global benchmarks translate into local impact.
                  </p>
                </div>

                {/* Real Impact */}
                <div className="bg-gray-50 rounded-tl-3xl rounded-br-3xl p-10">
                  <div className="w-14 h-14 bg-accent/10 text-accent rounded-tl-xl rounded-br-xl flex items-center justify-center mb-6">
                    <TrendingUp className="h-7 w-7" />
                  </div>
                  <h4 className="font-headline font-bold text-xl text-primary mb-3">Learning That Drives Real Impact</h4>
                  <p className="text-gray-600 leading-relaxed mb-3">
                    Every program includes applied assignments and capstone projects that require participants to apply learning within real sales contexts.
                  </p>
                  <p className="text-gray-500 text-sm leading-relaxed">
                    This ensures learning translates into practical execution rather than theoretical knowledge.
                  </p>
                </div>

              </div>
            </div>

          </div>
        </section>

        {/* ── FOUR QUADRANTS ── */}
        <section className="py-24 bg-primary">
          <div className="container mx-auto px-6">
            <div className="text-center text-white mb-16">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="h-px w-8 bg-accent" />
                <span className="text-accent text-sm font-bold uppercase tracking-widest">Our Capability Framework</span>
                <div className="h-px w-8 bg-accent" />
              </div>
              <h2 className="font-headline text-4xl sm:text-5xl font-extrabold leading-tight mb-4">The Four Quadrants of Sales Capability</h2>
              <p className="text-white/60 text-lg max-w-2xl mx-auto">
                Our programs develop sales professionals across four core capability areas, building well-rounded commercial leaders — not just better salespeople.
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: Target, quadrant: "01", title: "Core Skills", items: ["Prospecting", "Questioning", "Objection handling", "Closing", "Pipeline management"] },
                { icon: Brain, quadrant: "02", title: "Business Skills", items: ["Understanding markets", "Customer knowledge", "Commercial models", "Value positioning"] },
                { icon: Award, quadrant: "03", title: "Leadership Skills", items: ["Leading oneself", "Leading others", "Collaboration", "Performance management"] },
                { icon: Star, quadrant: "04", title: "Self-Mastery", items: ["Professional mindset", "Resilience", "Ethics", "Continuous development"] },
              ].map((q, i) => (
                <div key={i} className="bg-white/5 border border-white/10 rounded-tl-3xl rounded-br-3xl p-8 hover:bg-white/10 transition-colors group">
                  <div className="text-accent text-xs font-black uppercase tracking-widest mb-4">{q.quadrant}</div>
                  <div className="w-12 h-12 bg-accent/20 text-accent rounded-tl-xl rounded-br-xl flex items-center justify-center mb-5 group-hover:bg-accent group-hover:text-white transition-colors">
                    <q.icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-headline font-bold text-white text-xl mb-4">{q.title}</h3>
                  <ul className="space-y-2">
                    {q.items.map((item, j) => (
                      <li key={j} className="flex items-center gap-2 text-white/70 text-sm">
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
        <section className="py-24 bg-gray-50">
          <div className="container mx-auto px-6">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              {/* Image */}
              <div className="relative">
                <div className="relative h-[480px] rounded-tl-[3rem] rounded-br-[3rem] overflow-hidden shadow-2xl">
                  {workshopImage && (
                    <Image
                      src={workshopImage.imageUrl}
                      alt="KSS Workshop"
                      fill
                      className="object-cover"
                      sizes="(max-width: 1024px) 100vw, 50vw"
                    />
                  )}
                  <div className="absolute inset-0 bg-primary/10 mix-blend-multiply" />
                </div>
                {/* Floating quote */}
                <div className="absolute -bottom-6 -right-4 md:-right-8 bg-white p-6 rounded-tl-2xl rounded-br-2xl shadow-2xl max-w-xs">
                  <Quote className="h-6 w-6 text-accent mb-3" />
                  <p className="text-sm text-gray-600 italic leading-relaxed">"Sales is not a department — it is the lifeblood of every business. We're here to treat it that way."</p>
                  <p className="text-primary font-bold text-sm mt-3">— Kelvin Kuria, Co-Founder</p>
                </div>
              </div>

              {/* Copy */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-px w-8 bg-accent" />
                  <span className="text-accent text-sm font-bold uppercase tracking-widest">Our Story</span>
                </div>
                <h2 className="font-headline text-4xl sm:text-5xl font-extrabold text-primary leading-tight mb-6">
                  Born from a Gap<br />in the Market.
                </h2>
                <p className="text-gray-600 text-lg leading-relaxed mb-5">
                  KSS was founded when its co-founders — both veterans of Africa's commercial landscape — realised a simple truth: there was no professional, structured institution dedicated to growing sales talent on the continent.
                </p>
                <p className="text-gray-600 text-lg leading-relaxed mb-8">
                  Every other discipline had professional bodies and certification pathways. Engineers had KIEE. Accountants had ICPAK. Sales professionals had nothing. We built KSS to change that — forever.
                </p>
                <div className="grid grid-cols-2 gap-6">
                  {reasons.map((r, i) => (
                    <div key={i} className="bg-white border border-gray-100 rounded-tl-2xl rounded-br-2xl p-5 shadow-sm">
                      <p className="text-3xl font-extrabold text-primary mb-1">{r.stat}</p>
                      <p className="text-sm text-gray-500 font-medium uppercase tracking-wider">{r.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── VALUES ── */}
        <section className="py-24 bg-primary">
          <div className="container mx-auto px-6">
            <div className="text-center text-white mb-16">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="h-px w-8 bg-accent" />
                <span className="text-accent text-sm font-bold uppercase tracking-widest">What We Stand For</span>
                <div className="h-px w-8 bg-accent" />
              </div>
              <h2 className="font-headline text-4xl sm:text-5xl font-extrabold leading-tight mb-4">Our Core Values</h2>
              <p className="text-white/60 text-lg max-w-2xl mx-auto">The principles that guide every course, every interaction, and every outcome we deliver.</p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {values.map((v, i) => (
                <div key={i} className="bg-white/5 border border-white/10 rounded-tl-3xl rounded-br-3xl p-8 hover:bg-white/10 transition-colors group">
                  <div className="w-14 h-14 bg-accent/20 text-accent rounded-tl-xl rounded-br-xl flex items-center justify-center mb-6 group-hover:bg-accent group-hover:text-white transition-colors">
                    <v.icon className="h-7 w-7" />
                  </div>
                  <h3 className="font-headline font-bold text-white text-xl mb-3">{v.title}</h3>
                  <p className="text-white/60 leading-relaxed text-sm">{v.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── DELIVERY APPROACH ── */}
        <section className="py-24 bg-white">
          <div className="container mx-auto px-6">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              {/* Copy */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-px w-8 bg-accent" />
                  <span className="text-accent text-sm font-bold uppercase tracking-widest">How We Deliver</span>
                </div>
                <h2 className="font-headline text-4xl sm:text-5xl font-extrabold text-primary leading-tight mb-6">
                  Excellence in<br />Every Format.
                </h2>
                <p className="text-gray-600 text-lg leading-relaxed mb-8">
                  We know learning looks different for everyone. KSS is built around a blended model that meets you exactly where you are — whether you're a busy professional, a field salesperson, or an enterprise team leader.
                </p>
                <ul className="space-y-5">
                  {[
                    { icon: Users, title: "Collaborative Cohort Learning", desc: "Work through real-world challenges alongside peers who share your ambitions." },
                    { icon: Lightbulb, title: "Expert Facilitation", desc: "Every module is delivered by practitioners — active sales directors, not academics." },
                    { icon: Check, title: "Blended Delivery", desc: "In-person workshops, live online sessions, and self-paced digital content." },
                    { icon: TrendingUp, title: "Capstone Projects", desc: "Apply every concept to a real business scenario before you graduate." },
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-4">
                      <div className="mt-0.5 bg-accent/10 p-2.5 rounded-tl-lg rounded-br-lg text-accent shrink-0">
                        <item.icon className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-primary mb-1">{item.title}</h4>
                        <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Image */}
              <div className="relative">
                <div className="relative h-[480px] rounded-tl-[3rem] rounded-br-[3rem] overflow-hidden shadow-2xl">
                  {conferenceImage && (
                    <Image
                      src={conferenceImage.imageUrl}
                      alt="KSS Conference"
                      fill
                      className="object-cover"
                      sizes="(max-width: 1024px) 100vw, 50vw"
                    />
                  )}
                  <div className="absolute inset-0 bg-accent/10 mix-blend-multiply" />
                </div>
                <div className="absolute -bottom-6 -left-4 md:-left-8 bg-primary text-white p-6 rounded-tl-2xl rounded-br-2xl shadow-2xl">
                  <p className="text-4xl font-extrabold mb-1">70:20:10</p>
                  <p className="text-sm font-medium text-white/70 uppercase">Learning Framework<br />Used in Every Programme</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── FOUNDING PARTNERS ── */}
        <section className="py-24 bg-gray-50">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="h-px w-8 bg-accent" />
                <span className="text-accent text-sm font-bold uppercase tracking-widest">Our Foundation</span>
                <div className="h-px w-8 bg-accent" />
              </div>
              <h2 className="font-headline text-4xl sm:text-5xl font-extrabold text-primary mb-4">Built by Industry Leaders</h2>
              <p className="text-gray-500 text-lg max-w-2xl mx-auto">Founded through the partnership of two pioneering organisations transforming African commerce.</p>
            </div>
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {partners.map(partner => {
                const logo = PlaceHolderImages.find(p => p.id === partner.imageId);
                return (
                  <div key={partner.name} className="bg-white rounded-tl-3xl rounded-br-3xl border border-gray-100 shadow-lg hover:shadow-xl transition-all overflow-hidden group">
                    {logo && (
                      <div className="relative h-40 overflow-hidden bg-gray-100">
                        <Image
                          src={logo.imageUrl}
                          alt={partner.name}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-primary/40" />
                        <div className="absolute bottom-4 left-6">
                          <span className="bg-accent text-white text-xs font-bold px-3 py-1.5 rounded">Est. {partner.founded}</span>
                        </div>
                      </div>
                    )}
                    <div className="p-8">
                      <h3 className="font-headline font-bold text-xl text-primary mb-3">{partner.name}</h3>
                      <p className="text-gray-500 leading-relaxed">{partner.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── TEAM ── */}
        <section className="py-24 bg-white">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="h-px w-8 bg-accent" />
                <span className="text-accent text-sm font-bold uppercase tracking-widest">Leadership</span>
                <div className="h-px w-8 bg-accent" />
              </div>
              <h2 className="font-headline text-4xl sm:text-5xl font-extrabold text-primary mb-4">Meet Our Team</h2>
              <p className="text-gray-500 text-lg max-w-xl mx-auto">Experienced leaders driving the transformation of sales education across Africa.</p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {team.map((member) => {
                const image = PlaceHolderImages.find(p => p.id === member.imageId);
                return (
                  <div key={member.name} className="group">
                    <div className="relative h-72 rounded-tl-3xl rounded-br-3xl overflow-hidden mb-6 shadow-lg">
                      <Avatar className="w-full h-full rounded-none">
                        {image && <AvatarImage src={image.imageUrl} alt={member.name} className="object-cover w-full h-full" />}
                        <AvatarFallback className="w-full h-full rounded-none text-5xl font-bold bg-primary text-white">
                          {member.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute inset-0 bg-gradient-to-t from-primary/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <h3 className="font-headline font-bold text-xl text-primary mb-1">{member.name}</h3>
                    <p className="text-accent font-semibold text-sm mb-3">{member.role}</p>
                    <p className="text-gray-500 text-sm leading-relaxed">{member.bio}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── CLOSING STATEMENT ── */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-6">
            <div className="max-w-4xl mx-auto bg-primary rounded-tl-3xl rounded-br-3xl p-12 text-center shadow-2xl">
              <div className="flex items-center justify-center gap-3 mb-6">
                <div className="h-px w-8 bg-accent" />
                <span className="text-accent text-sm font-bold uppercase tracking-widest">Our Purpose</span>
                <div className="h-px w-8 bg-accent" />
              </div>
              <p className="font-headline text-2xl sm:text-3xl font-extrabold text-white leading-relaxed">
                "The Kenya School of Sales exists to elevate sales as a respected profession and to help organizations build disciplined, high-performing commercial teams."
              </p>
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="py-24 bg-accent">
          <div className="container mx-auto px-6 text-center">
            <h2 className="font-headline text-4xl sm:text-5xl font-extrabold text-white mb-5">Join Our Community</h2>
            <p className="text-white/80 text-xl max-w-2xl mx-auto mb-10">
              Be part of Africa's leading network of sales professionals. Start your journey today.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button size="lg" className="rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none bg-primary hover:bg-primary/90 text-white h-14 px-10 font-bold shadow-lg w-full sm:w-auto" asChild>
                <Link href="/courses">Get Started Today <ArrowRight className="ml-2 h-5 w-5" /></Link>
              </Button>
              <Button size="lg" variant="outline" className="rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none border-white text-white hover:bg-white hover:text-accent h-14 px-10 font-bold transition-all w-full sm:w-auto" asChild>
                <Link href="/contact">Talk to Us <Handshake className="ml-2 h-5 w-5" /></Link>
              </Button>
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </div>
  );
}
