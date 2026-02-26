'use client';
import { notFound, useParams, useRouter } from 'next/navigation';
import { useFirestore, useDoc } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { Program } from '@/lib/program-types';
import { useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
    ArrowLeft,
    Edit,
    Clock,
    Tag,
    BarChart,
    Users,
    CheckCircle,
    Layout,
    BookOpen,
    ClipboardList,
    Hash,
    Globe,
    RefreshCw,
} from 'lucide-react';

export default function ViewProgramPage() {
    const params = useParams();
    const router = useRouter();
    const id = Array.isArray(params.id) ? params.id[0] : params.id;
    const firestore = useFirestore();

    const programRef = useMemo(() => {
        if (!firestore || !id) return null;
        return doc(firestore, 'programs', id);
    }, [firestore, id]);

    const { data: program, loading } = useDoc<Program>(programRef as any);

    if (loading) {
        return (
            <div className="p-8 flex items-center justify-center min-h-screen">
                <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!program) {
        notFound();
    }

    const statusColors: Record<string, string> = {
        active: 'bg-green-100 text-green-700',
        draft: 'bg-yellow-100 text-yellow-700',
        archived: 'bg-gray-100 text-gray-500',
    };

    return (
        <div className="w-full min-h-screen bg-gray-50/50 p-2 md:p-4 font-body">
            <div className="w-full max-w-[1440px] mx-auto">

                {/* Header */}
                <div className="bg-primary text-white p-6 md:p-10 mb-6 rounded-tl-3xl rounded-br-3xl rounded-tr-none rounded-bl-none shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-accent/20 rounded-full blur-3xl opacity-20" />
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div className="flex items-center gap-6">
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-12 w-12 border-white/20 text-white hover:bg-white hover:text-primary rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none"
                                onClick={() => router.back()}
                            >
                                <ArrowLeft className="h-6 w-6" />
                            </Button>
                            <div>
                                <div className="flex items-center gap-3 mb-1">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Program</span>
                                    {program.programNumber && (
                                        <span className="text-[10px] font-black uppercase tracking-widest text-accent bg-accent/20 px-2 py-0.5 rounded">
                                            {program.programNumber}
                                        </span>
                                    )}
                                </div>
                                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight leading-tight">
                                    {program.programName}
                                </h1>
                                <div className="flex items-center gap-3 mt-2">
                                    <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${statusColors[program.status] || 'bg-white/10 text-white'}`}>
                                        {program.status}
                                    </span>
                                    {program.programCode && (
                                        <span className="text-[10px] font-mono text-white/40">{program.programCode}</span>
                                    )}
                                </div>
                            </div>
                        </div>
                        <Link href={`/a/programs/${program.id}`}>
                            <Button className="bg-accent hover:bg-accent/90 text-white h-12 px-6 rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none font-bold shadow-lg">
                                <Edit className="h-4 w-4 mr-2" />
                                Edit Program
                            </Button>
                        </Link>
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                    {/* LEFT: Main content */}
                    <div className="xl:col-span-8 space-y-6">

                        {/* Description */}
                        {program.shortDescription && (
                            <Card className="bg-white border border-primary/10 rounded-tl-3xl rounded-br-3xl shadow-xl p-8">
                                <h2 className="text-xl font-bold text-primary mb-4 flex items-center gap-2">
                                    <BookOpen className="h-5 w-5 text-accent" />
                                    About This Program
                                </h2>
                                <p className="text-gray-700 leading-relaxed">{program.shortDescription}</p>
                            </Card>
                        )}

                        {/* Objectives */}
                        {program.objectives && program.objectives.length > 0 && (
                            <Card className="bg-white border border-primary/10 rounded-tl-3xl rounded-br-3xl shadow-xl p-8">
                                <h2 className="text-xl font-bold text-primary mb-4 flex items-center gap-2">
                                    <CheckCircle className="h-5 w-5 text-accent" />
                                    Learning Objectives
                                </h2>
                                <ul className="space-y-3">
                                    {program.objectives.map((obj, i) => (
                                        <li key={i} className="flex items-start gap-3 p-3 rounded-xl bg-primary/5 border border-primary/10">
                                            <CheckCircle className="h-4 w-4 text-accent flex-shrink-0 mt-0.5" />
                                            <span className="text-gray-700 text-sm">{obj}</span>
                                        </li>
                                    ))}
                                </ul>
                            </Card>
                        )}

                        {/* Who Is It For */}
                        {program.whoIsItFor && program.whoIsItFor.length > 0 && (
                            <Card className="bg-white border border-primary/10 rounded-tl-3xl rounded-br-3xl shadow-xl p-8">
                                <h2 className="text-xl font-bold text-primary mb-4 flex items-center gap-2">
                                    <Users className="h-5 w-5 text-accent" />
                                    Who Is It For?
                                </h2>
                                <ul className="space-y-2">
                                    {program.whoIsItFor.map((item, i) => (
                                        <li key={i} className="flex items-start gap-2 text-gray-700 text-sm">
                                            <span className="text-accent font-bold mt-0.5">•</span>
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </Card>
                        )}

                        {/* Completion Requirements */}
                        {program.completionRequirements && program.completionRequirements.length > 0 && (
                            <Card className="bg-white border border-primary/10 rounded-tl-3xl rounded-br-3xl shadow-xl p-8">
                                <h2 className="text-xl font-bold text-primary mb-4 flex items-center gap-2">
                                    <ClipboardList className="h-5 w-5 text-accent" />
                                    Completion Requirements
                                </h2>
                                <ul className="space-y-3">
                                    {program.completionRequirements.map((req, i) => (
                                        <li key={i} className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                                            <span className="text-[10px] font-black text-accent bg-accent/10 rounded px-1.5 py-0.5 flex-shrink-0 mt-0.5">{i + 1}</span>
                                            <span className="text-gray-700 text-sm">{req}</span>
                                        </li>
                                    ))}
                                </ul>
                            </Card>
                        )}

                        {/* Curriculum Breakdown */}
                        {program.curriculumBreakdown && program.curriculumBreakdown.length > 0 && (
                            <Card className="bg-white border border-primary/10 rounded-tl-3xl rounded-br-3xl shadow-xl p-8">
                                <h2 className="text-xl font-bold text-primary mb-6 flex items-center gap-2">
                                    <Layout className="h-5 w-5 text-accent" />
                                    Curriculum Breakdown
                                </h2>
                                <div className="space-y-4">
                                    {program.curriculumBreakdown.map((mod, i) => (
                                        <div key={i} className="p-5 bg-primary/5 border-l-4 border-accent rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none">
                                            <h3 className="font-bold text-primary text-lg mb-3">{mod.name}</h3>
                                            {mod.themes && (
                                                <div className="mb-3">
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-primary/40 block mb-1">Themes</span>
                                                    <p className="text-gray-700 text-sm">{mod.themes}</p>
                                                </div>
                                            )}
                                            {mod.keyModules && (
                                                <div>
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-primary/40 block mb-1">Key Modules</span>
                                                    <p className="text-gray-700 text-sm">{mod.keyModules}</p>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        )}
                    </div>

                    {/* RIGHT: Sidebar */}
                    <div className="xl:col-span-4 space-y-6">

                        {/* Program Image */}
                        {program.image && (
                            <Card className="bg-white border border-primary/10 rounded-tl-3xl rounded-br-3xl shadow-xl overflow-hidden">
                                <div className="relative aspect-video w-full">
                                    <Image src={program.image} alt={program.programName} fill className="object-cover" />
                                </div>
                            </Card>
                        )}

                        {/* Key Details */}
                        <Card className="bg-white border border-primary/10 rounded-tl-3xl rounded-br-3xl shadow-xl p-6">
                            <h2 className="text-sm font-black uppercase tracking-widest text-primary/40 mb-5">Program Details</h2>
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-9 w-9 rounded-tl-lg rounded-br-lg bg-primary/5 flex items-center justify-center flex-shrink-0">
                                        <Tag className="h-4 w-4 text-accent" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-primary/40">Price</p>
                                        <p className="font-bold text-primary">{program.currency} {program.price?.toLocaleString()}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="h-9 w-9 rounded-tl-lg rounded-br-lg bg-primary/5 flex items-center justify-center flex-shrink-0">
                                        <Clock className="h-4 w-4 text-accent" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-primary/40">Duration</p>
                                        <p className="font-bold text-primary">{program.programDuration || '—'}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="h-9 w-9 rounded-tl-lg rounded-br-lg bg-primary/5 flex items-center justify-center flex-shrink-0">
                                        <BarChart className="h-4 w-4 text-accent" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-primary/40">Level</p>
                                        <p className="font-bold text-primary">Level {program.level}</p>
                                    </div>
                                </div>

                                {program.programFormat && program.programFormat.length > 0 && (
                                    <div className="flex items-center gap-3">
                                        <div className="h-9 w-9 rounded-tl-lg rounded-br-lg bg-primary/5 flex items-center justify-center flex-shrink-0">
                                            <Users className="h-4 w-4 text-accent" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-primary/40">Format</p>
                                            <p className="font-bold text-primary text-sm">{program.programFormat[0]}</p>
                                        </div>
                                    </div>
                                )}

                                {program.slug && (
                                    <div className="flex items-center gap-3">
                                        <div className="h-9 w-9 rounded-tl-lg rounded-br-lg bg-primary/5 flex items-center justify-center flex-shrink-0">
                                            <Globe className="h-4 w-4 text-accent" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-primary/40">Slug</p>
                                            <p className="font-mono text-sm text-primary">{program.slug}</p>
                                        </div>
                                    </div>
                                )}

                                {program.programCode && (
                                    <div className="flex items-center gap-3">
                                        <div className="h-9 w-9 rounded-tl-lg rounded-br-lg bg-primary/5 flex items-center justify-center flex-shrink-0">
                                            <Hash className="h-4 w-4 text-accent" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-primary/40">Program Code</p>
                                            <p className="font-mono text-sm text-primary">{program.programCode}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </Card>

                        {/* Intakes */}
                        {program.intakes && program.intakes.length > 0 && (
                            <Card className="bg-white border border-primary/10 rounded-tl-3xl rounded-br-3xl shadow-xl p-6">
                                <h2 className="text-sm font-black uppercase tracking-widest text-primary/40 mb-4">Intakes</h2>
                                <div className="space-y-2">
                                    {program.intakes.map((intake, i) => (
                                        <div key={i} className="flex items-center justify-between p-3 bg-primary/5 rounded-tl-lg rounded-br-lg border border-primary/10">
                                            <span className="font-bold text-sm text-primary">{intake.name}</span>
                                            <Badge className={`text-[9px] font-black uppercase ${intake.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                                {intake.status}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
