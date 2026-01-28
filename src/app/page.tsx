import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, CheckCircle, BrainCircuit } from "lucide-react";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { courses } from "@/lib/courses-data";
import { Header } from "@/components/shared/header";
import { Footer } from "@/components/shared/footer";

export default function Home() {
  const heroImage = PlaceHolderImages.find(p => p.id === 'hero-sales-training');
  const aiFeatureImage = PlaceHolderImages.find(p => p.id === 'ai-recommendation-feature');

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative bg-primary/5 py-20 md:py-32">
          <div className="container mx-auto px-4 text-center">
            <h1 className="font-headline text-4xl md:text-6xl font-bold text-primary">
              Unlock Your Sales Potential
            </h1>
            <p className="mt-4 max-w-2xl mx-auto text-lg text-foreground/80">
              KSS Institute provides world-class training programs designed to
              transform sales professionals into industry leaders.
            </p>
            <div className="mt-8 flex justify-center gap-4">
              <Button asChild size="lg">
                <Link href="/courses">Explore Courses <ArrowRight className="ml-2 h-5 w-5" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/login">Learner Portal</Link>
              </Button>
            </div>
          </div>
          {heroImage && (
             <div className="absolute inset-0 -z-10 opacity-5">
                <Image
                    src={heroImage.imageUrl}
                    alt={heroImage.description}
                    fill
                    className="object-cover"
                    data-ai-hint={heroImage.imageHint}
                />
             </div>
          )}
        </section>

        {/* Featured Courses Section */}
        <section id="courses" className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="font-headline text-3xl md:text-4xl font-bold">Featured Courses</h2>
              <p className="mt-2 text-muted-foreground max-w-xl mx-auto">
                Handpicked courses to kickstart your journey to sales excellence.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
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
                      <CardTitle className="font-headline text-xl">{course.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-grow">
                      <p className="text-muted-foreground text-sm">{course.description}</p>
                    </CardContent>
                    <CardContent className="flex justify-between text-sm text-muted-foreground">
                      <span>{course.duration}</span>
                      <span className="font-semibold">{course.level}</span>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            <div className="text-center mt-12">
              <Button asChild variant="secondary">
                <Link href="/courses">View All Courses</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* AI Feature Section */}
        <section className="bg-primary/5 py-20">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
              <div>
                <h2 className="font-headline text-3xl md:text-4xl font-bold">
                  Find Your Perfect Learning Path
                </h2>
                <p className="mt-4 text-lg text-foreground/80">
                  Our new AI-powered recommendation engine analyzes your profile and learning history to suggest courses that will accelerate your career. Stop guessing what to learn next.
                </p>
                <ul className="mt-6 space-y-4">
                  <li className="flex items-center gap-3">
                    <CheckCircle className="h-6 w-6 text-accent" />
                    <span className="font-medium">Personalized course suggestions</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="h-6 w-6 text-accent" />
                    <span className="font-medium">Align learning with career goals</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="h-6 w-6 text-accent" />
                    <span className="font-medium">Discover new areas for growth</span>
                  </li>
                </ul>
                <Button asChild size="lg" className="mt-8 bg-accent hover:bg-accent/90">
                  <Link href="/dashboard/recommendations">
                    <BrainCircuit className="mr-2 h-5 w-5" />
                    Try the AI Tool
                  </Link>
                </Button>
              </div>
              <div className="relative h-80 rounded-lg overflow-hidden shadow-lg">
                {aiFeatureImage && (
                  <Image
                    src={aiFeatureImage.imageUrl}
                    alt={aiFeatureImage.description}
                    fill
                    className="object-cover"
                    data-ai-hint={aiFeatureImage.imageHint}
                  />
                )}
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
