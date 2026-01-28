import { Header } from "@/components/shared/header";
import { Footer } from "@/components/shared/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export default function ContactPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">
        <section className="bg-primary/5 py-16 sm:py-20">
          <div className="container mx-auto px-4 text-center">
            <h1 className="font-headline text-4xl sm:text-5xl font-bold text-primary">
              Contact Us
            </h1>
            <p className="mt-4 max-w-2xl mx-auto text-base sm:text-lg text-foreground/80">
              Have a question? We'd love to hear from you.
            </p>
          </div>
        </section>
        <section className="py-16 sm:py-20">
            <div className="container mx-auto px-4 max-w-2xl">
                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline">Send us a message</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form className="grid gap-6">
                             <div className="grid gap-3">
                                <Label htmlFor="name">Name</Label>
                                <Input id="name" type="text" placeholder="Your Name" />
                            </div>
                             <div className="grid gap-3">
                                <Label htmlFor="email">Email</Label>
                                <Input id="email" type="email" placeholder="your@email.com" />
                            </div>
                             <div className="grid gap-3">
                                <Label htmlFor="message">Message</Label>
                                <Textarea id="message" placeholder="Your message..." rows={6}/>
                            </div>
                            <Button type="submit">Send Message</Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
