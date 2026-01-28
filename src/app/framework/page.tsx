import Image from "next/image";
import Link from "next/link";
import { Header } from "@/components/shared/header";
import { Footer } from "@/components/shared/footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Users, Presentation, Briefcase, TrendingUp, Cpu, Shield, Brain, Handshake, Target, Lightbulb, Group } from "lucide-react";

const pillars = [
    { title: "The Art of Selling", description: "Master core skills that turn conversations into sales.", icon: Target },
    { title: "Business Savvy", description: "Understand how businesses work and speak your clients' language.", icon: Briefcase },
    { title: "People Power", description: "Build influence and communication skills that make others follow you.", icon: Handshake },
    { title: "Personal Excellence", description: "Develop mindset, resilience, and emotional intelligence for lasting success.", icon: Brain },
]

const levels = [
    { level: 1, title: "Getting Started", description: "Learn the basics that every successful salesperson needs to know. Build confidence for your first sales." },
    { level: 2, title: "Hitting Your Stride", description: "Master advanced techniques, sell value not price, and build pipelines that exceed targets." },
    { level: 3, title: "Leading Others", description: "Strategic selling, key account management, and leadership skills for sales managers." },
    { level: 4, title: "The Big Picture", description: "Shape commercial strategy, manage multiple regions, and influence key stakeholders." },
    { level: 5, title: "Sales Visionary", description: "Design innovative go-to-market strategies and build sales systems that scale." },
]

export default function FrameworkPage() {
    const heroImage = PlaceHolderImages.find(p => p.id === 'framework-hero');

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">
        <section className="relative h-[560px] w-full">
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
            <div className="relative z-10 h-full flex flex-col justify-end">
                <div className="container mx-auto px-4 py-16">
                    <div className="max-w-3xl text-white">
                        <h1 className="font-headline text-4xl sm:text-5xl lg:text-6xl font-bold">
                            Your Roadmap to Sales Mastery
                        </h1>
                        <p className="mt-4 text-lg sm:text-xl text-white/90">
                           Ever wonder what separates good salespeople from great ones? Our proven framework shows you exactly how to get there.
                        </p>
                        <div className="mt-8 flex flex-col sm:flex-row gap-4">
                            <Button asChild size="lg"><Link href="/courses">Explore Courses</Link></Button>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <section className="py-16 sm:py-20">
            <div className="container mx-auto px-4">
                <div className="text-center mb-12">
                    <h2 className="font-headline text-3xl sm:text-4xl font-bold">Sales Framework Overview</h2>
                    <p className="mt-2 text-muted-foreground max-w-2xl mx-auto text-base sm:text-lg">
                        Think of This as Your Career GPS. Our Sales Capability Framework isn't just theory – it's your personal roadmap to success. Real-world skills that actually help you close deals and advance your career.
                    </p>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                    <Card className="text-center">
                        <CardHeader>
                            <TrendingUp className="h-10 w-10 mx-auto text-primary p-2 bg-primary/10 rounded-full" />
                            <CardTitle className="font-headline text-lg sm:text-xl">Structured Progression</CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm sm:text-base">Clear pathway from beginner to sales visionary with defined milestones at every level.</CardContent>
                    </Card>
                     <Card className="text-center">
                        <CardHeader>
                            <Cpu className="h-10 w-10 mx-auto text-primary p-2 bg-primary/10 rounded-full" />
                            <CardTitle className="font-headline text-lg sm:text-xl">Real-World Application</CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm sm:text-base">Forget boring textbooks. Learn skills that actually help you close deals and build relationships.</CardContent>
                    </Card>
                     <Card className="text-center">
                        <CardHeader>
                            <Brain className="h-10 w-10 mx-auto text-primary p-2 bg-primary/10 rounded-full" />
                            <CardTitle className="font-headline text-lg sm:text-xl">Competency Based</CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm sm:text-base">Master specific skills and behaviors needed at each stage of your sales journey.</CardContent>
                    </Card>
                     <Card className="text-center">
                        <CardHeader>
                            <Shield className="h-10 w-10 mx-auto text-primary p-2 bg-primary/10 rounded-full" />
                            <CardTitle className="font-headline text-lg sm:text-xl">Career Advancement</CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm sm:text-base">Always know what to work on next to reach your professional goals and dreams.</CardContent>
                    </Card>
                </div>
            </div>
        </section>

        <section className="bg-muted py-16 sm:py-20">
            <div className="container mx-auto px-4">
                <div className="text-center mb-12">
                    <h2 className="font-headline text-3xl sm:text-4xl font-bold">Your Journey from Newbie to Sales Superstar</h2>
                    <p className="mt-2 text-muted-foreground max-w-2xl mx-auto text-base sm:text-lg">
                        Whether you're just starting out or looking to level up, we've got you covered. Here's how you'll progress through your sales career.
                    </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                    {levels.map(level => (
                        <Card key={level.level} className={level.level > 3 ? "lg:col-span-3" : ""}>
                            <CardHeader>
                                <div className="flex items-center gap-4">
                                    <span className="flex items-center justify-center h-12 w-12 rounded-full bg-primary text-primary-foreground font-headline text-2xl font-bold">{level.level}</span>
                                    <CardTitle className="font-headline text-lg sm:text-xl">{level.title}</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent className="text-sm sm:text-base">{level.description}</CardContent>
                        </Card>
                    ))}
                </div>
                 <div className="text-center mt-12">
                    <Button asChild size="lg">
                        <Link href="/courses">Begin Your Journey</Link>
                    </Button>
                 </div>
            </div>
        </section>

        <section className="py-16 sm:py-20">
            <div className="container mx-auto px-4">
                 <div className="text-center mb-12">
                    <h2 className="font-headline text-3xl sm:text-4xl font-bold">The Four Pillars of Excellence</h2>
                     <p className="mt-2 text-muted-foreground max-w-2xl mx-auto text-base sm:text-lg">
                       Success in sales isn't just about one thing – it's about excelling in these four key areas. Build strength in each to become truly exceptional.
                    </p>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {pillars.map(pillar => (
                        <Card key={pillar.title} className="text-center">
                            <CardHeader>
                                <pillar.icon className="h-10 w-10 mx-auto text-primary p-2 bg-primary/10 rounded-full" />
                                <CardTitle className="font-headline text-lg sm:text-xl">{pillar.title}</CardTitle>
                            </CardHeader>
                            <CardContent className="text-sm sm:text-base">{pillar.description}</CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </section>
        
        <section className="bg-primary/5 py-16 sm:py-20">
            <div className="container mx-auto px-4">
                 <div className="text-center mb-12">
                    <h2 className="font-headline text-3xl sm:text-4xl font-bold">How We Make Learning Actually Work</h2>
                     <p className="mt-2 text-muted-foreground max-w-2xl mx-auto text-base sm:text-lg">
                       Forget boring lectures and endless PowerPoints. We use proven methods that actually stick and change how you think and act.
                    </p>
                </div>
                <div className="grid md:grid-cols-3 gap-8 text-center max-w-5xl mx-auto">
                    <Card className="bg-transparent border-0 shadow-none">
                        <CardHeader>
                             <Group className="h-10 w-10 mx-auto text-primary p-2 bg-primary/10 rounded-full" />
                            <CardTitle className="font-headline text-lg sm:text-xl">Learn With Your Peers</CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm sm:text-base">Practice with real people on actual sales challenges with classmates who understand your journey.</CardContent>
                    </Card>
                     <Card className="bg-transparent border-0 shadow-none">
                        <CardHeader>
                            <Users className="h-10 w-10 mx-auto text-primary p-2 bg-primary/10 rounded-full" />
                            <CardTitle className="font-headline text-lg sm:text-xl">Learn from the Pros</CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm sm:text-base">Battle-tested sales veterans who've been where you want to go share real solutions that work.</CardContent>
                    </Card>
                     <Card className="bg-transparent border-0 shadow-none">
                        <CardHeader>
                            <Lightbulb className="h-10 w-10 mx-auto text-primary p-2 bg-primary/10 rounded-full" />
                            <CardTitle className="font-headline text-lg sm:text-xl">Learn Your Way</CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm sm:text-base">Online when busy, in-person for connection. Study at your pace, on your schedule.</CardContent>
                    </Card>
                </div>
            </div>
        </section>

      </main>
      <Footer />
    </div>
  );
}
