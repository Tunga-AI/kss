import Image from "next/image";
import { Header } from "@/components/shared/header";
import { Footer } from "@/components/shared/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Check, Handshake, Lightbulb, TrendingUp, Users } from "lucide-react";

const team = [
    { name: "Kelvin Kuria", role: "Co-founder", imageId: "kelvin-kuria" },
    { name: "Olive Kamande", role: "Co-founder", imageId: "olive-kamande" },
    { name: "Alex Mahugu", role: "General Manager", imageId: "alex-mahugu" },
];

const partners = [
    { name: "Yusudi", imageId: "yusudi-logo", founded: 2015, description: "Founded in 2015, Yusudi pioneered sales enablement in Africa, transforming sales into a respected career path and revolutionizing sales team management." },
    { name: "Commercial Club of Africa", imageId: "cca-logo", founded: 2024, description: "Platform of sales leaders shaping the future of African commerce through collaboration." },
]

export default function AboutPage() {
  
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">
        <section className="bg-primary/5 py-16 sm:py-24">
          <div className="container mx-auto px-4 text-center">
            <h1 className="font-headline text-4xl sm:text-5xl font-bold text-primary">
              Elevating Sales. Empowering Professionals. Transforming Africa.
            </h1>
            <p className="mt-4 max-w-2xl mx-auto text-lg sm:text-xl text-foreground/80">
              Kenya School of Sales is the first professional sales school in Kenya, dedicated to making sales training desirable and simplifying sales career development across Africa.
            </p>
          </div>
        </section>

        <section className="py-16 sm:py-20">
          <div className="container mx-auto px-4 grid md:grid-cols-2 gap-12 items-center">
              <div className="text-center md:text-left">
                  <h2 className="font-headline text-3xl sm:text-4xl font-bold text-primary">Our Mission</h2>
                  <p className="mt-4 text-lg text-foreground/80">To make sales training desirable and simplify sales career development across Africa.</p>
              </div>
              <div className="text-center md:text-left">
                  <h2 className="font-headline text-3xl sm:text-4xl font-bold text-primary">Our Vision</h2>
                  <p className="mt-4 text-lg text-foreground/80">To nurture bold African commercial superstars who drive economic transformation.</p>
              </div>
          </div>
        </section>

        <section className="bg-muted py-16 sm:py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="font-headline text-3xl sm:text-4xl font-bold">Why Choose KSS?</h2>
              <p className="mt-2 text-muted-foreground max-w-2xl mx-auto text-base sm:text-lg">
                The first structured, internationally-recognized sales education platform in Kenya with global standards and proven results.
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 font-headline"><Check /> Structured Learning, Finally</CardTitle>
                </CardHeader>
                <CardContent>First-of-its-kind structured sales education in Kenya with international standards.</CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 font-headline"><Handshake /> Globally Benchmarked</CardTitle>
                </CardHeader>
                <CardContent>Built on UK Institute of Sales Professionals framework, recognized worldwide.</CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 font-headline"><TrendingUp /> Certified Excellence</CardTitle>
                </CardHeader>
                <CardContent>Vocational qualifications aligned to UK Ofqual standards with CPD certification.</CardContent>
              </Card>
               <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 font-headline"><Lightbulb /> African Context</CardTitle>
                </CardHeader>
                <CardContent>Global best practices adapted for real-world African sales environments.</CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section className="py-16 sm:py-20">
            <div className="container mx-auto px-4">
                 <div className="text-center mb-12">
                    <h2 className="font-headline text-3xl sm:text-4xl font-bold">How We Deliver Excellence</h2>
                     <p className="mt-2 text-muted-foreground max-w-2xl mx-auto text-base sm:text-lg">
                        Proven methods and innovative approaches that ensure your learning translates to real results and career transformation.
                    </p>
                </div>
                <div className="grid md:grid-cols-2 gap-8 text-center max-w-4xl mx-auto">
                    <Card>
                        <CardHeader>
                            <Users className="h-10 w-10 mx-auto text-primary p-2 bg-primary/10 rounded-full" />
                            <CardTitle className="font-headline text-xl">Collaborative Learning</CardTitle>
                        </CardHeader>
                        <CardContent>Work together on real-world sales challenges and simulations.</CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <Lightbulb className="h-10 w-10 mx-auto text-primary p-2 bg-primary/10 rounded-full" />
                            <CardTitle className="font-headline text-xl">Expert Facilitation</CardTitle>
                        </CardHeader>
                        <CardContent>Learn from experienced sales professionals with industry insights.</CardContent>
                    </Card>
                     <Card>
                        <CardHeader>
                            <Check className="h-10 w-10 mx-auto text-primary p-2 bg-primary/10 rounded-full" />
                            <CardTitle className="font-headline text-xl">Blended Approach</CardTitle>
                        </CardHeader>
                        <CardContent>Virtual sessions, physical workshops, and self-paced learning.</CardContent>
                    </Card>
                     <Card>
                        <CardHeader>
                            <TrendingUp className="h-10 w-10 mx-auto text-primary p-2 bg-primary/10 rounded-full" />
                            <CardTitle className="font-headline text-xl">Capstone Project</CardTitle>
                        </CardHeader>
                        <CardContent>Apply all concepts to solve real business problems.</CardContent>
                    </Card>
                </div>
            </div>
        </section>
        
        <section className="bg-muted py-16 sm:py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="font-headline text-3xl sm:text-4xl font-bold">Built by Industry Leaders</h2>
              <p className="mt-2 text-muted-foreground max-w-2xl mx-auto text-base sm:text-lg">
                Founded through the partnership of two pioneering organizations transforming African commerce.
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              {partners.map(partner => {
                const logo = PlaceHolderImages.find(p => p.id === partner.imageId);
                return (
                    <Card key={partner.name}>
                        <CardContent className="pt-6 flex flex-col items-center text-center">
                            {logo && <Image src={logo.imageUrl} alt={`${partner.name} logo`} width={150} height={60} data-ai-hint={logo.imageHint} className="mb-4"/>}
                            <p className="font-bold">Founded {partner.founded}</p>
                            <p className="mt-2 text-muted-foreground">{partner.description}</p>
                        </CardContent>
                    </Card>
                )
              })}
            </div>
          </div>
        </section>

        <section className="py-16 sm:py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="font-headline text-3xl sm:text-4xl font-bold">Meet Our Team</h2>
              <p className="mt-2 text-muted-foreground max-w-xl mx-auto text-base sm:text-lg">
                Experienced leaders driving the transformation of sales education across Africa.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-8 md:gap-16">
              {team.map((member) => {
                const image = PlaceHolderImages.find(p => p.id === member.imageId);
                return (
                  <div key={member.name} className="text-center">
                    <Avatar className="w-24 h-24 sm:w-32 sm:h-32 mx-auto">
                      {image && <AvatarImage src={image.imageUrl} alt={member.name} data-ai-hint={image.imageHint} />}
                      <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <h3 className="mt-4 font-headline text-lg font-semibold">{member.name}</h3>
                    <p className="text-muted-foreground">{member.role}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

         <section className="bg-primary/5 py-16 sm:py-20">
            <div className="container mx-auto px-4 text-center">
                <h2 className="font-headline text-3xl sm:text-4xl font-bold">Join Our Community</h2>
                <p className="mt-4 max-w-xl mx-auto text-base sm:text-lg text-muted-foreground">
                   Be part of Africa's leading sales professional network and transform your career.
                </p>
                <Button size="lg" className="mt-8">
                    Get Started
                </Button>
            </div>
        </section>

      </main>
      <Footer />
    </div>
  );
}
