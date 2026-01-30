import Image from "next/image";
import Link from "next/link";
import { Header } from "@/components/shared/header";
import { Footer } from "@/components/shared/footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { PlaceHolderImages } from "@/lib/placeholder-images";

const tiers = [
    {
        name: "Startup",
        price: "40",
        userCount: "1-10 Users",
        features: ["Access to all courses", "Progress tracking", "Email support"],
        cta: "Get Started"
    },
    {
        name: "Growth",
        price: "35",
        userCount: "11-50 Users",
        features: ["All Startup features", "Dedicated account manager", "Usage reports"],
        cta: "Get Started"
    },
    {
        name: "Enterprise",
        price: "30",
        userCount: "51-100 Users",
        features: ["All Growth features", "Custom branding", "API access"],
        cta: "Get Started"
    },
    {
        name: "Custom",
        price: null,
        userCount: "100+ Users",
        features: ["All Enterprise features", "On-premise deployment", "Volume discounts"],
        cta: "Contact Sales"
    }
];

export default function ForBusinessPage() {
    const heroImage = PlaceHolderImages.find(p => p.id === 'hero-sales-training');

    return (
        <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-grow">
                <section className="relative h-[560px] w-full">
                    {heroImage && (
                        <Image
                            src={heroImage.imageUrl}
                            alt="A team of professionals in a meeting"
                            fill
                            className="object-cover"
                            data-ai-hint={heroImage.imageHint}
                        />
                    )}
                    <div className="absolute inset-0 bg-black/60" />
                    <div className="relative z-10 h-full flex flex-col justify-end">
                        <div className="container mx-auto px-4 py-16">
                            <div className="max-w-3xl text-white">
                                <h1 className="font-headline text-4xl sm:text-5xl font-bold">
                                    Empower Your Team. Drive Your Growth.
                                </h1>
                                <p className="mt-4 text-lg sm:text-xl text-white/90">
                                    Invest in your team’s success with our corporate training solutions, designed to elevate skills and deliver measurable results.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>
                <section className="py-16 sm:py-20">
                    <div className="container mx-auto px-4">
                        <div className="text-center mb-12">
                            <h2 className="font-headline text-3xl sm:text-4xl font-bold">Flexible Plans for Teams of All Sizes</h2>
                            <p className="mt-2 text-muted-foreground max-w-2xl mx-auto text-base sm:text-lg">
                                Choose the plan that fits your organization's needs and budget. Unlock unlimited access to our entire course catalog.
                            </p>
                        </div>
                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
                            {tiers.map((tier) => (
                                <Card key={tier.name} className="flex flex-col">
                                    <CardHeader>
                                        <CardTitle className="font-headline text-2xl">{tier.name}</CardTitle>
                                        <CardDescription>{tier.userCount}</CardDescription>
                                        {tier.price ? (
                                             <div className="text-4xl font-bold pt-4">${tier.price}<span className="text-base font-normal text-muted-foreground">/user/mo</span></div>
                                        ) : (
                                            <div className="text-4xl font-bold pt-4">Custom</div>
                                        )}
                                    </CardHeader>
                                    <CardContent className="flex-grow">
                                        <ul className="space-y-3">
                                            {tier.features.map((feature) => (
                                                <li key={feature} className="flex items-center gap-2">
                                                    <Check className="h-5 w-5 text-accent" />
                                                    <span>{feature}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </CardContent>
                                    <CardContent>
                                        <Button asChild className="w-full" variant={tier.name === 'Growth' ? 'default' : 'secondary'}>
                                            <Link href={tier.price ? `/register-business?tier=${tier.name}&price=${tier.price}` : '/contact'}>{tier.cta}</Link>
                                        </Button>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                </section>
            </main>
            <Footer />
        </div>
    );
}
