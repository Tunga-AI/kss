'use client';

import { useMemo, useState } from 'react';
import Image from "next/image";
import Link from "next/link";
import { Header } from "@/components/shared/header";
import { Footer } from "@/components/shared/footer";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, ArrowRight, Monitor, Clock, BookOpen, PlayCircle, Star } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useUsersFirestore } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { useCollection } from '@/firebase/firestore/use-collection';
import type { Program } from '@/lib/program-types';

/* ── E-Learning card — distinct horizontal/vertical "course card" layout ── */
function ElearningCard({ course }: { course: Program }) {
  const title = course.title || course.programName || 'Untitled Course';
  const desc = course.shortDescription || course.description || '';
  const price = course.price === 0 ? 'Free' : course.price ? `${course.currency || 'KES'} ${Number(course.price).toLocaleString()}` : 'Free';
  const modules = (course as any).modules?.length || (course as any).moduleCount || null;
  const duration = (course as any).duration || null;
  const rating = (course as any).rating || null;

  return (
    <Link href={`/e-learning/${course.slug}`} className="block group">
      <Card className="relative overflow-hidden h-96 border-0 shadow-lg rounded-tl-2xl rounded-br-2xl rounded-tr-none rounded-bl-none hover:shadow-2xl transition-all">
        {((course as any).imageUrl || course.image) ? (
          <Image
            src={(course as any).imageUrl || course.image || ''}
            alt={title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-primary/10">
            <Monitor className="h-12 w-12 text-primary/20" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

        {/* Play overlay for hover */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center pb-20">
          <div className="bg-white/20 backdrop-blur-sm rounded-full p-4 shadow-lg scale-90 group-hover:scale-100 transition-transform">
            <PlayCircle className="h-12 w-12 text-white" />
          </div>
        </div>

        <div className="relative h-full flex flex-col justify-end p-6 text-white">
          <Badge className="bg-accent text-white absolute top-4 left-4 rounded-tl-md rounded-br-md rounded-tr-none rounded-bl-none font-bold">
            E-Learning
          </Badge>

          <h3 className="font-headline text-2xl font-bold mb-2 line-clamp-2">{title}</h3>

          {/* Meta row at bottom over gradient */}
          <div className="flex flex-wrap gap-3 text-xs text-white/80 font-medium mb-4">
            {modules && (
              <span className="flex items-center gap-1">
                <BookOpen className="h-3 w-3" /> {modules} Modules
              </span>
            )}
            {duration && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" /> {duration}
              </span>
            )}
            {rating && (
              <span className="flex items-center gap-1 text-accent font-bold">
                <Star className="h-3 w-3 fill-accent" /> {rating}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Monitor className="h-3 w-3" /> Self-Paced
            </span>
          </div>

          <div className="flex justify-between items-center text-sm font-medium border-t border-white/20 pt-4 mt-auto">
            {course.level ? (
              <Badge variant="secondary" className="rounded-tl-sm rounded-br-sm rounded-tr-none rounded-bl-none bg-white text-primary">
                Level {course.level}
              </Badge>
            ) : (
              <span />
            )}
            <div className="text-right flex items-center gap-2">
              <span className="font-bold text-lg">{price}</span>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}

function CourseList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState('all');

  const firestore = useUsersFirestore();

  const moocQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, "programs"), where("programType", "==", "E-Learning"));
  }, [firestore]);

  const { data: moocCourses, loading } = useCollection<Program>(moocQuery as any);

  const filteredCourses = useMemo(() => {
    if (!moocCourses) return [];
    return moocCourses.filter(course => {
      const matchesSearch = (course.title || course.programName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (course.description || course.shortDescription || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesLevel = levelFilter === 'all' || String(course.level || '') === levelFilter;
      return matchesSearch && matchesLevel;
    });
  }, [moocCourses, searchTerm, levelFilter]);

  return (
    <section className="py-16 sm:py-20 bg-gray-50">
      <div className="container mx-auto px-6">

        {/* Section heading */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-px w-8 bg-accent" />
              <span className="text-accent text-xs font-black uppercase tracking-widest">Self-Paced Online</span>
            </div>
            <h2 className="font-headline text-3xl sm:text-4xl font-extrabold text-primary">Available Courses</h2>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/30" />
              <Input
                type="text"
                placeholder="Search courses..."
                className="pl-10 h-12 rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none border-primary/10 bg-white"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={levelFilter} onValueChange={setLevelFilter}>
              <SelectTrigger className="h-12 w-full sm:w-44 rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none border-primary/10 bg-white font-bold">
                <SelectValue placeholder="All Levels" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="1">Level 1</SelectItem>
                <SelectItem value="2">Level 2</SelectItem>
                <SelectItem value="3">Level 3</SelectItem>
                <SelectItem value="Beginner">Beginner</SelectItem>
                <SelectItem value="Intermediate">Intermediate</SelectItem>
                <SelectItem value="Advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {loading && (
          <div className="text-center py-16 text-primary/40 font-medium">Loading courses...</div>
        )}

        {!loading && filteredCourses.length === 0 && (
          <div className="text-center py-16">
            <Monitor className="h-12 w-12 text-primary/20 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-primary mb-2">No courses found</h2>
            <p className="text-gray-400">Try adjusting your search or filters.</p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredCourses.map((course) => (
            <ElearningCard key={course.id} course={course} />
          ))}
        </div>
      </div>
    </section>
  );
}

export default function ElearningPage() {
  const firestore = useUsersFirestore();
  const settingsRef = firestore ? collection(firestore, 'settings') : null;
  const { data: settings } = useCollection<any>(
    settingsRef ? query(settingsRef, where('__name__', '==', 'branding')) : null
  );
  const branding = settings?.[0];

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">

        {/* ── HERO ── */}
        <section className="relative min-h-screen w-full flex items-end bg-primary">
          {branding?.elearningHeroUrl && (
            <Image src={branding.elearningHeroUrl} alt="KSS Digital Campus" fill className="object-cover" />
          )}
          <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/50 to-transparent" />
          <div className="relative z-10 w-full">
            <div className="container mx-auto px-4 lg:px-6 py-20 pb-16">
              <div className="grid lg:grid-cols-2 gap-16 items-center">
                <div>
                  <Card className="bg-white border-0 shadow-2xl rounded-tl-3xl rounded-br-3xl rounded-tr-none rounded-bl-none overflow-hidden">
                    <div className="bg-accent p-6 sm:p-8">
                      <p className="text-white/80 text-sm font-bold uppercase tracking-widest mb-2">Digital Campus</p>
                      <h1 className="font-headline text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight">
                        Learn Sales. Anytime. Anywhere.
                      </h1>
                    </div>
                    <div className="p-6 sm:p-8 space-y-4">
                      <p className="text-base sm:text-lg text-primary/80 leading-relaxed">
                        Self-paced e-learning courses built for sales professionals. Study at your own pace and earn credentials aligned to the ISP Sales Capability Framework.
                      </p>
                      <div className="flex flex-col sm:flex-row gap-3 pt-2">
                        <Button size="lg" className="rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none bg-primary hover:bg-primary/90 text-white shadow-md transition-all" asChild>
                          <a href="#courses">Browse Courses <ArrowRight className="ml-2 h-5 w-5" /></a>
                        </Button>
                        <Button size="lg" variant="outline" className="rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none border-primary text-primary hover:bg-primary hover:text-white shadow-md transition-all" asChild>
                          <Link href="/courses">View All Programs</Link>
                        </Button>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── COURSES ── */}
        <div id="courses">
          <CourseList />
        </div>

      </main>
      <Footer />
    </div>
  );
}
