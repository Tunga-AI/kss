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
import { Search } from 'lucide-react';
import { useFirestore } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { useCollection } from '@/firebase/firestore/use-collection';
import type { Program } from '@/lib/program-types';

function CourseList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState('all');

  const firestore = useFirestore();

  const moocQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, "programs"), where("programType", "==", "E-Learning"));
  }, [firestore]);

  const { data: moocCourses, loading } = useCollection<Program>(moocQuery);

  const filteredCourses = useMemo(() => {
    if (!moocCourses) return [];
    return moocCourses.filter(course => {
      const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            course.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesLevel = levelFilter === 'all' || course.level === levelFilter;
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
            const courseImage = PlaceHolderImages.find(p => p.id === course.imageId);
            return (
              <Link href={`/e-learning/${course.id}`} key={course.id} className="block group">
                <Card className="relative overflow-hidden h-96 border-0 shadow-lg">
                  {courseImage && (
                    <Image
                      src={courseImage.imageUrl}
                      alt={course.title}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      data-ai-hint={courseImage.imageHint}
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                  <div className="relative h-full flex flex-col justify-end p-6 text-white">
                    <h3 className="font-headline text-2xl font-bold">{course.title}</h3>
                    <div className="flex justify-between items-center text-sm mt-4 font-medium">
                      <Badge variant="secondary">{course.level}</Badge>
                      <span className="font-bold text-lg">{course.price}</span>
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

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">
        <section className="relative h-[560px] w-full">
          {coursesImage && (
            <Image
              src={coursesImage.imageUrl}
              alt={coursesImage.description}
              fill
              className="object-cover"
              data-ai-hint={coursesImage.imageHint}
            />
          )}
          <div className="absolute inset-0 bg-black/60" />
          <div className="relative z-10 h-full flex flex-col justify-end">
            <div className="container mx-auto px-4 py-16">
              <div className="max-w-3xl text-white">
                <h1 className="font-headline text-4xl sm:text-5xl font-bold">
                  E-Learning
                </h1>
                <p className="mt-4 text-lg sm:text-xl text-white/90">
                  Explore our massive open online courses (MOOCs) and learn at your own pace, for free.
                </p>
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
