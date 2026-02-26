'use client';

import { useMemo, useState } from 'react';
import Image from "next/image";
import Link from "next/link";
import { Header } from "@/components/shared/header";
import { Footer } from "@/components/shared/footer";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Badge } from "@/components/ui/badge";
import { Search, ArrowRight } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useUsersFirestore } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { useCollection } from '@/firebase/firestore/use-collection';
import type { Program } from '@/lib/program-types';

function CourseList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState('all');

  const firestore = useUsersFirestore(); // programs live in kenyasales DB

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
    <section className="py-16 sm:py-20">
      <div className="container mx-auto px-4">
        <div className="mb-12 flex flex-col md:flex-row gap-4">
          <div className="relative w-full max-w-sm">
            <Input
              type="text"
              placeholder="Search courses..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          </div>
          <Select value={levelFilter} onValueChange={setLevelFilter}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Filter by level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="Beginner">Beginner</SelectItem>
              <SelectItem value="Intermediate">Intermediate</SelectItem>
              <SelectItem value="Advanced">Advanced</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {loading && <div className="text-center">Loading courses...</div>}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
          {filteredCourses.map((course) => {
            return (
              <Link href={`/e-learning/${course.slug}`} key={course.id} className="block group">
                <Card className="relative overflow-hidden h-96 border-0 shadow-lg rounded-tl-2xl rounded-br-2xl rounded-tr-none rounded-bl-none hover:shadow-2xl transition-all">
                  {course.imageUrl && (
                    <Image
                      src={course.imageUrl || course.image}
                      alt={course.title || course.programName || ''}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                  <div className="relative h-full flex flex-col justify-end p-6 text-white">
                    <h3 className="font-headline text-2xl font-bold">{course.title || course.programName}</h3>
                    <div className="flex justify-between items-center text-sm mt-4 font-medium">
                      <Badge variant="secondary" className="rounded-tl-sm rounded-br-sm rounded-tr-none rounded-bl-none">{course.level}</Badge>
                      <span className="font-bold text-lg">{course.price === 0 ? 'Free' : (course.price?.toLocaleString() || 'Free')}</span>
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
        {!loading && filteredCourses.length === 0 && (
          <div className="text-center py-16">
            <h2 className="text-2xl font-bold">No courses found</h2>
            <p className="text-muted-foreground mt-2">Try adjusting your search or filters.</p>
          </div>
        )}
      </div>
    </section>
  );
}


export default function ElearningPage() {
  const coursesImage = PlaceHolderImages.find(p => p.id === 'courses-hero');
  const brandingFirestore = useUsersFirestore();
  const settingsRef = brandingFirestore ? collection(brandingFirestore, 'settings') : null;
  const { data: settings } = useCollection<any>(
    settingsRef ? query(settingsRef, where('__name__', '==', 'branding')) : null
  );
  const branding = settings?.[0];

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">
        <section className="relative min-h-screen w-full flex items-end bg-primary">
          {branding?.elearningHeroUrl && (
            <Image
              src={branding.elearningHeroUrl}
              alt="E-Learning Hero"
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
                      World-Class E-Learning Courses
                    </h1>
                  </div>
                  <div className="p-6 sm:p-8 space-y-4">
                    <p className="text-base sm:text-lg text-primary/80 leading-relaxed">
                      Learn at your own pace with our comprehensive online courses designed for sales professionals.
                    </p>
                    <Button size="lg" className="rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none bg-primary hover:bg-primary/90 text-white shadow-md transition-all" asChild>
                      <Link href="/courses">
                        View All Programs <ArrowRight className="ml-2 h-5 w-5" />
                      </Link>
                    </Button>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </section>
        <CourseList />
      </main>
      <Footer />
    </div>
  );
}
