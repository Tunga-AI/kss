import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { ArrowRight, CheckCircle, BrainCircuit, Users, BookOpen, Star, Award } from "lucide-react";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { courses } from "@/lib/courses-data";
import { Header } from "@/components/shared/header";
import { Footer } from "@/components/shared/footer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative bg-primary/5 py-16 sm:py-20 md:py-24">
          <div className="container mx-auto px-4 z-10 relative">
            <div className="text-center">
              <h1 className="font-headline text-4xl sm:text-5xl lg:text-6xl font-bold text-primary">
                Unlock Your Sales Potential
              </h1>
              <p className="mt-4 max-w-3xl mx-auto text-base sm:text-lg text-foreground/80">
                KSS Institute provides world-class training programs designed to
                transform sales professionals into industry leaders.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row justify-center items-center gap-4">
                <Button asChild size="lg">
                  <Link href="/courses">Explore Courses <ArrowRight className="ml-2 h-5 w-5" /></Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href="/login">Learner Portal</Link>
                </Button>
              </div>
            </div>

            <div className="mt-16 grid grid-cols-2 lg:grid-cols-4 gap-4 text-center">
                <Card className="bg-background/70 backdrop-blur-sm">
                    <CardHeader>
                        <Award className="h-8 w-8 mx-auto text-accent"/>
                        <p className="text-4xl font-bold font-headline">10+</p>
                        <CardDescription>Years of Experience</CardDescription>
                    </CardHeader>
                </Card>
                 <Card className="bg-background/70 backdrop-blur-sm">
                    <CardHeader>
                        <BookOpen className="h-8 w-8 mx-auto text-accent"/>
                        <p className="text-4xl font-bold font-headline">50+</p>
                        <CardDescription>Expert-Led Courses</CardDescription>
                    </CardHeader>
                </Card>
                 <Card className="bg-background/70 backdrop-blur-sm">
                    <CardHeader>
                        <Users className="h-8 w-8 mx-auto text-accent"/>
                        <p className="text-4xl font-bold font-headline">10k+</p>
                        <CardDescription>Successful Graduates</CardDescription>
                    </CardHeader>
                </Card>
                 <Card className="bg-background/70 backdrop-blur-sm">
                    <CardHeader>
                        <Star className="h-8 w-8 mx-auto text-accent"/>
                        <p className="text-4xl font-bold font-headline">4.9/5</p>
                        <CardDescription>Average Rating</CardDescription>
                    </CardHeader>
                </Card>
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
        <section id="courses" className="py-16 sm:py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="font-headline text-3xl sm:text-4xl font-bold">Featured Courses</h2>
              <p className="mt-2 text-muted-foreground max-w-xl mx-auto text-base sm:text-lg">
                Handpicked courses to kickstart your journey to sales excellence.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
              {courses.slice(0, 4).map((course) => {
                const courseImage = PlaceHolderImages.find(p => p.id === course.imageId);
                return (
                  <Card key={course.id} className="flex flex-col overflow-hidden hover:shadow-lg transition-shadow duration-300">
                    {courseImage && (
                      <div className="relative h-40 sm:h-48 w-full">
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
                    <CardContent className="flex justify-between items-center text-sm font-semibold">
                      <span className="text-primary text-lg">{course.price}</span>
                      <span className="text-muted-foreground font-medium">{course.level}</span>
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
                    <CardTitle className="font-headline text-xl">Expert Instructors</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">Learn from the best. Our instructors are seasoned sales leaders and industry veterans with a passion for teaching.</p>
                </CardContent>
              </Card>
               <Card className="border-0 bg-transparent shadow-none">
                <CardHeader>
                    <CheckCircle className="h-10 w-10 mx-auto text-primary p-2 bg-primary/10 rounded-full" />
                    <CardTitle className="font-headline text-xl">Practical Curriculum</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">Our courses are designed for the real world. You'll learn practical skills and strategies you can apply immediately.</p>
                </CardContent>
              </Card>
               <Card className="border-0 bg-transparent shadow-none">
                <CardHeader>
                    <Users className="h-10 w-10 mx-auto text-primary p-2 bg-primary/10 rounded-full" />
                    <CardTitle className="font-headline text-xl">Career Support</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">Your success is our success. We provide career guidance and networking opportunities to help you advance.</p>
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
                                    <p className="text-muted-foreground">"{testimonial.testimonial}"</p>
                                </CardContent>
                                <CardFooter className="flex items-center gap-4">
                                     {avatarImage && (
                                        <Avatar>
                                            <AvatarImage src={avatarImage.imageUrl} alt={testimonial.name} data-ai-hint={avatarImage.imageHint} />
                                            <AvatarFallback>{testimonial.name.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                     )}
                                    <div>
                                        <p className="font-semibold">{testimonial.name}</p>
                                        <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                                    </div>
                                </CardFooter>
                            </Card>
                        )
                    })}
                </div>
            </div>
        </section>

        {/* Contact CTA Section */}
        <section className="py-16 sm:py-20">
            <div className="container mx-auto px-4 text-center">
                <h2 className="font-headline text-3xl sm:text-4xl font-bold">Ready to Elevate Your Career?</h2>
                <p className="mt-4 max-w-xl mx-auto text-base sm:text-lg text-muted-foreground">
                    Get in touch with our admissions team to find the perfect program for you or your team.
                </p>
                <Button size="lg" className="mt-8">
                    <Link href="/contact">Contact Us</Link>
                </Button>
            </div>
        </section>

      </main>
      <Footer />
    </div>
  );
}
