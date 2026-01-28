import Image from "next/image";
import Link from "next/link";
import { Header } from "@/components/shared/header";
import { Footer } from "@/components/shared/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { courses } from "@/lib/courses-data";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { ArrowRight } from "lucide-react";

export default function CoursesPage() {
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
                  Our Courses
                </h1>
                <p className="mt-4 text-lg sm:text-xl text-white/90">
                  Browse our comprehensive catalog of sales training programs. Find the perfect course to advance your skills and career.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 sm:py-20">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
              {courses.map((course) => {
                const courseImage = PlaceHolderImages.find(p => p.id === course.imageId);
                return (
                  <Card key={course.id} className="flex flex-col overflow-hidden hover:shadow-lg transition-shadow duration-300">
                    {courseImage && (
                      <div className="relative h-48 w-full">
                        <Image
                          src={courseImage.imageUrl}
                          alt={courseImage.description}
                          fill
                          className="object-cover"
                          data-ai-hint={courseImage.imageHint}
                        />
                      </div>
                    )}
                    <CardHeader>
                      <CardTitle className="font-headline text-lg sm:text-xl">{course.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-grow">
                      <p className="text-muted-foreground text-sm line-clamp-3">{course.description}</p>
                    </CardContent>
                    <CardContent className="flex justify-between items-center text-sm text-muted-foreground">
                      <span>{course.duration}</span>
                      <span className="font-semibold">{course.level}</span>
                    </CardContent>
                    <CardContent>
                      <Button asChild className="w-full">
                        <Link href={`/courses/${course.id}`}>View Details <ArrowRight className="ml-2 h-4 w-4"/></Link>
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

    