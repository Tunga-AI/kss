'use client';
import Image from "next/image";
import Link from "next/link";
import { Header } from "@/components/shared/header";
import { Footer } from "@/components/shared/footer";
import { Card } from "@/components/ui/card";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Badge } from "@/components/ui/badge";
import { useUsersFirestore } from "@/firebase";
import { collection, query, where } from "firebase/firestore";
import { useCollection } from "@/firebase/firestore/use-collection";
import type { Program } from "@/lib/program-types";
import type { Event as KssEvent } from "@/lib/event-types";
import { useMemo, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ArrowRight, Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";

type UnifiedProgram = {
    id: string;
    title: string;
    slug: string;
    type: 'Core' | 'Short' | 'E-Learning' | 'Event';
    image?: string;
    level?: number;
    currency: string;
    price: number | string;
    link: string;
}

function ProgramGrid({ programs }: { programs: UnifiedProgram[] }) {
    if (programs.length === 0) {
        return <div className="text-center py-20 text-primary/40 font-bold">No programs found matching the filter.</div>
    }
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
            {programs.map((program) => {
                return (
                    <Link href={program.link} key={program.id} className="block group">
                        <Card className="relative overflow-hidden h-96 border-0 shadow-lg rounded-tl-2xl rounded-br-2xl hover:shadow-2xl transition-all">
                            {program.image && (
                                <Image
                                    src={program.image}
                                    alt={program.title}
                                    fill
                                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                                />
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                            <div className="relative h-full flex flex-col justify-end p-6 text-white">
                                <Badge className={`${program.type === 'Core' ? 'bg-accent text-white' : program.type === 'Event' ? 'bg-green-500 text-white' : 'bg-primary text-white'} absolute top-4 left-4 rounded-md font-bold`}>
                                    {program.type}
                                </Badge>
                                <h3 className="font-headline text-2xl font-bold leading-tight">{program.title}</h3>
                                <div className="flex justify-between items-center text-sm mt-4 font-medium">
                                    {program.level ? (
                                        <Badge variant="secondary" className="rounded-sm">
                                            Level {program.level}
                                        </Badge>
                                    ) : <div />}
                                    <div className="text-right">
                                        <span className="font-bold text-lg">{program.price === 'Free' ? 'Free' : `${program.currency} ${typeof program.price === 'number' ? program.price.toLocaleString() : program.price}`}</span>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </Link>
                );
            })}
        </div>
    );
}

export default function ProgramsMarketplacePage() {
    const coursesImage = PlaceHolderImages.find(p => p.id === 'courses-hero');
    const firestore = useUsersFirestore();

    const brandingFirestore = useUsersFirestore();
    const settingsRef = brandingFirestore ? collection(brandingFirestore, 'settings') : null;
    const { data: settings } = useCollection<any>(
        settingsRef ? query(settingsRef, where('__name__', '==', 'branding')) : null
    );
    const branding = settings?.[0];

    const [searchQuery, setSearchQuery] = useState('');

    // Fetch Programs
    const programsQuery = useMemo(() => {
        if (!firestore) return null;
        return query(collection(firestore, "programs"));
    }, [firestore]);
    const { data: rawPrograms, loading: loadingPrograms } = useCollection<Program>(programsQuery as any);

    // Fetch Events
    const eventsQuery = useMemo(() => {
        if (!firestore) return null;
        return query(collection(firestore, "events"));
    }, [firestore]);
    const { data: rawEvents, loading: loadingEvents } = useCollection<KssEvent>(eventsQuery as any);

    const unifiedCatalog = useMemo<UnifiedProgram[]>(() => {
        const catalog: UnifiedProgram[] = [];

        if (rawPrograms) {
            rawPrograms.forEach(p => {
                catalog.push({
                    id: p.id,
                    title: p.programName || p.title || '',
                    slug: p.slug,
                    type: (p.programType as ('Core' | 'Short' | 'E-Learning')) || 'Core',
                    image: p.image || p.imageUrl,
                    level: p.level,
                    currency: p.currency || 'KES',
                    price: p.price || 0,
                    link: `/courses/${p.slug}`
                });
            });
        }

        if (rawEvents) {
            rawEvents.forEach(e => {
                let startingPrice = 0;
                if (e.ticketTypes && e.ticketTypes.length > 0) {
                    startingPrice = Math.min(...e.ticketTypes.map(t => Number(t.price) || 0));
                }

                catalog.push({
                    id: e.id,
                    title: e.title,
                    slug: e.slug,
                    type: 'Event',
                    image: e.imageUrl,
                    currency: e.currency || 'KES',
                    price: startingPrice === 0 ? 'Free' : `From ${startingPrice.toLocaleString()}`,
                    link: `/events/${e.slug}` // keep event legacy link formatting or direct to new public event view
                });
            });
        }

        return catalog.filter(c => c.title.toLowerCase().includes(searchQuery.toLowerCase()));
    }, [rawPrograms, rawEvents, searchQuery]);

    // Derived filtered catalogs
    const corePrograms = unifiedCatalog.filter(c => c.type === 'Core');
    const shortPrograms = unifiedCatalog.filter(c => c.type === 'Short');
    const elearningPrograms = unifiedCatalog.filter(c => c.type === 'E-Learning');
    const events = unifiedCatalog.filter(c => c.type === 'Event');

    const loading = loadingPrograms || loadingEvents;

    return (
        <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-grow bg-gray-50/50">
                <section className="relative min-h-screen w-full flex items-end bg-primary overflow-hidden pb-16 pt-32">
                    {branding?.programsHeroUrl && (
                        <Image
                            src={branding.programsHeroUrl}
                            alt="Programs Hero"
                            fill
                            className="object-cover opacity-60 mix-blend-overlay"
                        />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-primary/50 to-primary/30" />
                    <div className="relative z-10 w-full">
                        <div className="container mx-auto px-4 lg:px-6 py-20 pb-16">
                            <div className="max-w-4xl">
                                <Card className="bg-white border-0 shadow-2xl rounded-tl-3xl rounded-br-3xl rounded-tr-none rounded-bl-none overflow-hidden">
                                    <div className="bg-accent p-6 sm:p-8">
                                        <p className="text-white/80 text-sm font-bold uppercase tracking-widest mb-2">
                                            Explore The Marketplace
                                        </p>
                                        <h1 className="font-headline text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight">
                                            Learning & Events Catalog
                                        </h1>
                                    </div>
                                    <div className="p-6 sm:p-8 space-y-6">
                                        <p className="text-base sm:text-lg text-primary/80 leading-relaxed font-medium">
                                            Discover our comprehensive range of professional programs, self-paced courses, and exclusive industry events.
                                        </p>

                                        {/* Search Bar - aligned left, matching brand aesthetic */}
                                        <div className="relative group max-w-xl">
                                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-primary/40 group-focus-within:text-accent transition-colors z-10" />
                                            <Input
                                                placeholder="Search for courses, bootcamps, or events..."
                                                className="h-14 pl-14 pr-6 rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none text-base shadow-inner border-primary/20 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-accent transition-all font-medium"
                                                value={searchQuery}
                                                onChange={e => setSearchQuery(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </Card>
                            </div>
                        </div>
                    </div>
                </section>

                <section id="catalog" className="py-16 sm:py-24">
                    <div className="container mx-auto px-4">
                        <Tabs defaultValue="all" className="w-full">
                            <div className="flex flex-col sm:flex-row justify-between items-center mb-12 gap-6">
                                <h2 className="text-3xl font-black text-primary font-headline uppercase tracking-tight">Our Catalog</h2>
                                <div className="overflow-x-auto pb-2 w-full sm:w-auto">
                                    <TabsList className="bg-white p-1 rounded-xl shadow-sm border border-primary/5 inline-flex min-w-max">
                                        <TabsTrigger value="all" className="rounded-lg font-bold px-6 py-3 data-[state=active]:bg-primary data-[state=active]:text-white">All Offerings</TabsTrigger>
                                        <TabsTrigger value="core" className="rounded-lg font-bold px-6 py-3 data-[state=active]:bg-primary data-[state=active]:text-white">Core Programs</TabsTrigger>
                                        <TabsTrigger value="short" className="rounded-lg font-bold px-6 py-3 data-[state=active]:bg-primary data-[state=active]:text-white">Short Courses</TabsTrigger>
                                        <TabsTrigger value="elearning" className="rounded-lg font-bold px-6 py-3 data-[state=active]:bg-primary data-[state=active]:text-white">E-Learning</TabsTrigger>
                                        <TabsTrigger value="events" className="rounded-lg font-bold px-6 py-3 data-[state=active]:bg-primary data-[state=active]:text-white">Events</TabsTrigger>
                                    </TabsList>
                                </div>
                            </div>

                            {loading && (
                                <div className="flex justify-center items-center py-32">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-accent"></div>
                                </div>
                            )}

                            {!loading && (
                                <div className="animate-in fade-in duration-500">
                                    <TabsContent value="all" className="m-0 mt-6"><ProgramGrid programs={unifiedCatalog} /></TabsContent>
                                    <TabsContent value="core" className="m-0 mt-6"><ProgramGrid programs={corePrograms} /></TabsContent>
                                    <TabsContent value="short" className="m-0 mt-6"><ProgramGrid programs={shortPrograms} /></TabsContent>
                                    <TabsContent value="elearning" className="m-0 mt-6"><ProgramGrid programs={elearningPrograms} /></TabsContent>
                                    <TabsContent value="events" className="m-0 mt-6"><ProgramGrid programs={events} /></TabsContent>
                                </div>
                            )}
                        </Tabs>
                    </div>
                </section>
            </main>
            <Footer />
        </div>
    );
}
