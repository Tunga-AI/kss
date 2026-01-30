'use client';
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, CheckCircle, BrainCircuit, Users, Award, Calendar, MapPin, ChevronDown } from "lucide-react";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Header } from "@/components/shared/header";
import { Footer } from "@/components/shared/footer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useFirestore } from "@/firebase";
import { collection, query, where, limit } from "firebase/firestore";
import { useCollection } from "@/firebase/firestore/use-collection";
import type { Program } from "@/lib/program-types";
import { useMemo } from "react";

const testimonials = [
  {
    name: "Alex Johnson",
    role: "Senior Account Executive",
    avatarId: "testimonial-1",
    testimonial: "KSS Institute transformed my career. The negotiation tactics I learned were instrumental in closing the biggest deal of my career. I can't recommend them enough!",
  },
  {
    name: "Maria Garcia",
    role: "Sales Development Manager",
    avatarId: "testimonial-2",
    testimonial: "The courses are incredibly practical and relevant. I was able to apply what I learned immediately and saw a significant improvement in my team's performance.",
  },
  {
    name: "Sam Chen",
    role: "Founder, Tech Startup",
    avatarId: "testimonial-3",
    testimonial: "As a founder, I needed to learn how to sell. KSS gave me the confidence and the framework to build a successful sales process from scratch. Invaluable!",
  }
];


export default function Home() {
  const heroImage = PlaceHolderImages.find(p => p.id === 'hero-sales-training');
  const aiFeatureImage = PlaceHolderImages.find(p => p.id === 'ai-recommendation-feature');
  const galleryImages = [
      PlaceHolderImages.find(p => p.id === 'event-workshop-calling'),
      PlaceHolderImages.find(p => p.id === 'event-conference-summit'),
      PlaceHolderImages.find(p => p.id === 'framework-hero'),
      PlaceHolderImages.find(p => p.id === 'success-hero')
  ].filter(Boolean);

  const firestore = useFirestore();

  const coursesQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, "programs"), where("programType", "in", ["Core Course", "Short Course"]), limit(3));
  }, [firestore]);

  const moocQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, "programs"), where("programType", "==", "E-Learning"), limit(4));
  }, [firestore]);

  const eventsQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, "programs"), where("programType", "==", "Event"), limit(3));
  }, [firestore]);

  const { data: courses } = useCollection<Program>(coursesQuery);
  const { data: moocCourses } = useCollection<Program>(moocQuery);
  const { data: events } = useCollection<Program>(eventsQuery);

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative min-h-screen w-full flex items-end">
            {heroImage && (
                <Image
                    src={heroImage.imageUrl}
                    alt={heroImage.description}
                    fill
                    className="object-cover"
                    data-ai-hint={heroImage.imageHint}
                />
            )}
            <div className="absolute inset-0 bg-black/60" />
            <div className="relative z-10 w-full">
                <div className="container mx-auto px-4 py-24 sm:py-32">
                    <div className="max-w-3xl text-white">
                        <h1 className="font-headline text-4xl sm:text-5xl lg:text-6xl font-bold">
                            Unlock Your Sales Potential
                        </h1>
                        <p className="mt-4 text-lg sm:text-xl text-white/90">
                            World-class training programs designed to transform you into an industry leader.
                        </p>
                        <div className="mt-8 flex flex-col sm:flex-row items-start gap-4">
                             <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button size="lg">
                                  Get Started <ChevronDown className="ml-2 h-5 w-5" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent>
                                <DropdownMenuItem asChild>
                                  <Link href="/courses">Courses</Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                  <Link href="/e-learning">E-Learning</Link>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        {/* Featured Courses Section */}
        <section id="courses" className="py-16 sm:py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="font-headline text-3xl sm:text-4xl font-bold">Featured Courses</h2>
              <p className="mt-2 text-muted-foreground max-w-xl mx-auto text-base sm:text-lg">
                Handpicked courses to kickstart your journey to sales excellence.
              </p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
              {courses?.slice(0, 1).map((course) => {
                const courseImage = PlaceHolderImages.find(p => p.id === course.imageId);
                return (
                  <Link href={`/courses/${course.id}`} key={course.id} className="block group">
                    <Card className="relative overflow-hidden h-full min-h-[36rem] lg:min-h-[42rem] border-0 shadow-lg">
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
              <div className="grid grid-rows-2 gap-6 md:gap-8">
                {courses?.slice(1, 3).map((course) => {
                  const courseImage = PlaceHolderImages.find(p => p.id === course.imageId);
                  return (
                    <Link href={`/courses/${course.id}`} key={course.id} className="block group">
                      <Card className="relative overflow-hidden h-full border-0 shadow-lg">
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
            </div>
            <div className="text-center mt-12">
              <Button asChild variant="secondary">
                <Link href="/courses">View All Courses</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Why Choose KSS Section */}
        <section className="bg-muted py-16 sm:py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="font-headline text-3xl sm:text-4xl font-bold">Why Choose KSS Institute?</h2>
              <p className="mt-2 text-muted-foreground max-w-xl mx-auto text-base sm:text-lg">
                We are committed to providing the best sales education in the industry.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8 text-center">
              <Card className="border-0 bg-transparent shadow-none">
                <CardHeader>
                    <Award className="h-10 w-10 mx-auto text-primary p-2 bg-primary/10 rounded-full" />
                    <CardTitle className="font-headline text-lg sm:text-xl">Expert Instructors</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground text-sm sm:text-base">Learn from the best. Our instructors are seasoned sales leaders and industry veterans with a passion for teaching.</p>
                </CardContent>
              </Card>
               <Card className="border-0 bg-transparent shadow-none">
                <CardHeader>
                    <CheckCircle className="h-10 w-10 mx-auto text-primary p-2 bg-primary/10 rounded-full" />
                    <CardTitle className="font-headline text-lg sm:text-xl">Practical Curriculum</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground text-sm sm:text-base">Our courses are designed for the real world. You'll learn practical skills and strategies you can apply immediately.</p>
                </CardContent>
              </Card>
               <Card className="border-0 bg-transparent shadow-none">
                <CardHeader>
                    <Users className="h-10 w-10 mx-auto text-primary p-2 bg-primary/10 rounded-full" />
                    <CardTitle className="font-headline text-lg sm:text-xl">Career Support</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground text-sm sm:text-base">Your success is our success. We provide career guidance and networking opportunities to help you advance.</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>


        {/* AI Feature Section */}
        <section className="py-16 sm:py-20">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
              <div className="order-2 md:order-1">
                <h2 className="font-headline text-3xl sm:text-4xl font-bold">
                  Find Your Perfect Learning Path
                </h2>
                <p className="mt-4 text-base sm:text-lg text-foreground/80">
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
              <div className="relative h-64 sm:h-80 md:h-96 rounded-lg overflow-hidden shadow-lg order-1 md:order-2">
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

        {/* Upcoming Events Section */}
        <section className="bg-muted py-16 sm:py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="font-headline text-3xl sm:text-4xl font-bold">Upcoming Events</h2>
              <p className="mt-2 text-muted-foreground max-w-xl mx-auto text-base sm:text-lg">
                Join our webinars, workshops, and conferences to learn from industry experts and network with peers.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {events?.map((event) => {
                const eventImage = PlaceHolderImages.find(p => p.id === event.imageId);
                return (
                  <Link href={`/events/${event.id}`} key={event.id} className="block group">
                     <Card className="relative overflow-hidden h-96 border-0 shadow-lg rounded-lg">
                      {eventImage && (
                        <Image
                          src={eventImage.imageUrl}
                          alt={event.title}
                          fill
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                          data-ai-hint={eventImage.imageHint}
                        />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                      <div className="relative h-full flex flex-col justify-end p-6 text-white">
                        <h3 className="font-headline text-2xl font-bold">{event.title}</h3>
                        <div className="flex items-center gap-2 text-sm mt-2">
                          <Calendar className="h-4 w-4" />
                          {event.date && <span>{format(new Date(event.date), 'MMMM d, yyyy')}</span>}
                        </div>
                        <div className="flex justify-between items-center text-sm mt-4 font-medium">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            <span>{event.location}</span>
                          </div>
                          <Badge variant={event.price === 'Free' ? 'secondary' : 'default'}>{event.price}</Badge>
                        </div>
                      </div>
                    </Card>
                  </Link>
                );
              })}
            </div>
            <div className="text-center mt-12">
              <Button asChild>
                <Link href="/events">View All Events</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Featured E-learning Section */}
        <section id="e-learning" className="py-16 sm:py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="font-headline text-3xl sm:text-4xl font-bold">Free E-Learning Courses</h2>
              <p className="mt-2 text-muted-foreground max-w-xl mx-auto text-base sm:text-lg">
                Start learning at your own pace with our collection of free online courses.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
              {moocCourses?.map((course) => {
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
                        <h3 className="font-headline text-xl font-bold">{course.title}</h3>
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
            <div className="text-center mt-12">
              <Button asChild variant="secondary">
                <Link href="/e-learning">Explore All Free Courses</Link>
              </Button>
            </div>
          </div>
        </section>
        
        {/* Testimonials Section */}
        <section className="bg-primary/5 py-16 sm:py-20">
            <div className="container mx-auto px-4">
                <div className="text-center mb-12">
                    <h2 className="font-headline text-3xl sm:text-4xl font-bold">From Our Graduates</h2>
                    <p className="mt-2 text-muted-foreground max-w-xl mx-auto text-base sm:text-lg">
                        Hear how KSS has impacted the careers of our students.
                    </p>
                </div>
                <div className="grid lg:grid-cols-3 gap-8">
                    {testimonials.map((testimonial) => {
                       const avatarImage = PlaceHolderImages.find(p => p.id === testimonial.avatarId);
                        return (
                             <Card key={testimonial.name} className="flex flex-col">
                                <CardContent className="pt-6 flex-grow">
                                    <p className="text-muted-foreground text-sm sm:text-base">"{testimonial.testimonial}"</p>
                                </CardContent>
                                <CardHeader>
                                     {avatarImage && (
                                        <Avatar>
                                            <AvatarImage src={avatarImage.imageUrl} alt={testimonial.name} data-ai-hint={avatarImage.imageHint} />
                                            <AvatarFallback>{testimonial.name.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                     )}
                                    <div>
                                        <p className="font-semibold text-base sm:text-lg">{testimonial.name}</p>
                                        <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                                    </div>
                                </CardHeader>
                            </Card>
                        )
                    })}
                </div>
            </div>
        </section>

        {/* Gallery Preview Section */}
        <section className="py-16 sm:py-20">
            <div className="container mx-auto px-4">
                <div className="text-center mb-12">
                    <h2 className="font-headline text-3xl sm:text-4xl font-bold">Glimpses of Our Community</h2>
                    <p className="mt-2 text-muted-foreground max-w-xl mx-auto text-base sm:text-lg">
                        See our students and instructors in action during workshops and events.
                    </p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {galleryImages.map((image, index) => (
                        image && <div key={index} className="relative h-64 rounded-lg overflow-hidden shadow-lg">
                            <Image
                                src={image.imageUrl}
                                alt={image.description}
                                fill
                                className="object-cover"
                                data-ai-hint={image.imageHint}
                            />
                        </div>
                    ))}
                </div>
                 <div className="text-center mt-12">
                    <Button asChild variant="secondary">
                        <Link href="/gallery">View Full Gallery</Link>
                    </Button>
                </div>
            </div>
        </section>

        {/* Contact CTA Section */}
        <section className="bg-muted py-16 sm:py-20">
            <div className="container mx-auto px-4 text-center">
                <h2 className="font-headline text-3xl sm:text-4xl font-bold">Ready to Elevate Your Career?</h2>
                <p className="mt-4 max-w-xl mx-auto text-base sm:text-lg text-muted-foreground">
                    Get in touch with our admissions team to find the perfect program for you or your team.
                </p>
                <Button size="lg" className="mt-8" asChild>
                    <Link href="/contact">Contact</Link>
                </Button>
            </div>
        </section>

      </main>
      <Footer />
    </div>
  );
}
