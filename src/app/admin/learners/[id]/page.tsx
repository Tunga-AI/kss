'use client';
import { useMemo } from 'react';
import { useParams, notFound, useRouter } from 'next/navigation';
import { useUsersFirestore, useDoc, useCollection } from '@/firebase';
import { doc, query, collection } from 'firebase/firestore';
import type { Learner } from '@/lib/learners-types';
import type { Program } from '@/lib/program-types';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    ArrowLeft,
    User as UserIcon,
    Mail,
    Calendar,
    Shield,
    GraduationCap,
    Clock,
    Activity,
    Award,
    RefreshCw,
    Settings2,
    BookOpen
} from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { updateLearner } from '@/lib/learners';
import { cn } from "@/lib/utils";
import { format } from 'date-fns';

export default function LearnerDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = Array.isArray(params.id) ? params.id[0] : params.id;
    const firestore = useUsersFirestore();

    const learnerRef = useMemo(() => {
        if (!firestore || !id) return null;
        return doc(firestore, 'learners', id);
    }, [firestore, id]);

    const { data: learner, loading } = useDoc<Learner>(learnerRef as any);

    const programsQuery = useMemo(() => firestore ? query(collection(firestore, "programs")) : null, [firestore]);
    const { data: programs, loading: programsLoading } = useCollection<Program>(programsQuery as any);

    const handleStatusChange = async (newStatus: Learner['status']) => {
        if (firestore && id) {
            updateLearner(firestore, id, { status: newStatus });
        }
    };

    const handleProgramChange = async (newProgram: string) => {
        if (firestore && id) {
            // Convert "none" to empty string for deselecting program
            updateLearner(firestore, id, { program: newProgram === 'none' ? '' : newProgram });
        }
    };

    if (loading) {
        return (
            <div className="p-8 flex items-center justify-center min-h-screen">
                <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!learner) {
        notFound();
    }

    return (
        <div className="w-full min-h-screen bg-gray-50/50 p-2 md:p-4 font-body">
            <div className="w-full max-w-[1440px] mx-auto">
                {/* Hero Header Section */}
                <div className="bg-primary text-white p-6 md:p-10 mb-6 border-b border-primary/10 rounded-tl-3xl rounded-br-3xl rounded-tr-none rounded-bl-none shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-accent/20 rounded-full blur-3xl opacity-20" />

                    <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                        <div className="relative group shrink-0">
                            <div className="h-32 w-32 md:h-40 md:w-40 rounded-tl-3xl rounded-br-3xl overflow-hidden border-4 border-white/10 shadow-2xl relative">
                                <Avatar className="h-full w-full rounded-none">
                                    <AvatarImage src={learner.avatar} className="object-cover" />
                                    <AvatarFallback className="rounded-none bg-accent/20 text-accent text-4xl font-black">
                                        {learner.name.charAt(0)}
                                    </AvatarFallback>
                                </Avatar>
                            </div>
                        </div>

                        <div className="text-center md:text-left flex-1">
                            <div className="flex flex-col md:flex-row md:items-center gap-3 mb-2">
                                <h1 className="text-3xl md:text-5xl font-bold tracking-tight">
                                    {learner.name} <span className="text-white/40 text-2xl font-mono ml-3">#{learner.id}</span>
                                </h1>
                                <Badge className={cn(
                                    "w-fit mx-auto md:mx-0 font-black text-[10px] uppercase tracking-widest px-3 py-1 rounded-tl-md rounded-br-md rounded-tr-none rounded-bl-none shadow-lg border-none",
                                    learner.status === 'Active' ? 'bg-green-500 text-white' : 'bg-primary/40 text-white/50'
                                )}>
                                    {learner.status} Learner
                                </Badge>
                            </div>
                            <p className="text-white/60 text-lg flex items-center justify-center md:justify-start gap-2">
                                <Mail className="h-4 w-4" /> {learner.email}
                            </p>
                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 mt-6 text-[10px] font-black uppercase tracking-widest text-white/40">
                                <div className="flex items-center gap-2">
                                    <GraduationCap className="h-4 w-4 text-accent" /> {learner.program || 'No Active Program'}
                                </div>
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-accent" /> Since {learner.joinedDate ? format(new Date(learner.joinedDate), 'MMM yyyy') : 'N/A'}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <Button
                                variant="outline"
                                className="h-12 border-white/20 text-white hover:bg-white hover:text-primary px-6 rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none transition-all"
                                onClick={() => router.back()}
                            >
                                <ArrowLeft className="h-4 w-4 mr-2" /> Back
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                    {/* Main Stats/Details */}
                    <div className="xl:col-span-8 space-y-6">
                        <div className="bg-white border border-primary/10 rounded-tl-3xl rounded-br-3xl shadow-xl overflow-hidden">
                            <div className="p-8 md:p-10">
                                <h2 className="text-xl font-bold text-primary mb-8 flex items-center gap-2">
                                    <Shield className="h-5 w-5 text-accent" />
                                    Account Profile
                                </h2>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                    <div className="space-y-6">
                                        <DetailItem icon={UserIcon} label="Full Name" value={learner.name} />
                                        <DetailItem icon={Mail} label="Email Address" value={learner.email} />
                                        <DetailItem icon={Calendar} label="Commencement" value={learner.joinedDate ? format(new Date(learner.joinedDate), 'PPP') : 'N/A'} />
                                    </div>
                                    <div className="space-y-6">
                                        <DetailItem icon={Award} label="Credentials" value="0 Total" />
                                        <DetailItem icon={Activity} label="System Status" value={learner.status} highlight />
                                        <DetailItem icon={Shield} label="Access Tier" value="Standard Learner" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Recent Activity/Timeline placeholder */}
                        <div className="bg-white border border-primary/10 rounded-tl-3xl rounded-br-3xl shadow-xl p-8 relative overflow-hidden min-h-[300px]">
                            <h2 className="text-xl font-bold text-primary mb-8 flex items-center gap-2">
                                <Clock className="h-5 w-5 text-accent" />
                                Platform Engagement
                            </h2>
                            <div className="flex flex-col items-center justify-center h-40 bg-primary/5 border-2 border-dashed border-primary/5 rounded-2xl">
                                <Activity className="h-8 w-8 text-primary/10 mb-2" />
                                <p className="text-[10px] font-black uppercase tracking-widest text-primary/30">Latency in activity stream</p>
                            </div>
                        </div>
                    </div>

                    {/* Controls/Sidebar */}
                    <div className="xl:col-span-4 space-y-6">
                        <div className="bg-primary text-white border border-primary/10 rounded-tl-3xl rounded-br-3xl shadow-xl p-8 relative overflow-hidden">
                            <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-accent/20 rounded-full blur-3xl opacity-20" />

                            <h2 className="text-xl font-bold mb-8 flex items-center gap-2">
                                <Settings2 className="h-5 w-5 text-accent" />
                                Administrative Controls
                            </h2>

                            <div className="space-y-8 relative z-10">
                                <div className="space-y-4">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Academic Program Pipeline</Label>
                                    <Select value={learner.program || 'none'} onValueChange={handleProgramChange} disabled={programsLoading}>
                                        <SelectTrigger className="h-14 bg-white/10 border-white/10 text-white rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none font-bold">
                                            <div className="flex items-center gap-2">
                                                <BookOpen className="h-4 w-4 text-accent" />
                                                <SelectValue placeholder="Assign Program" />
                                            </div>
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl border-primary/10">
                                            <SelectItem value="none">De-link Program</SelectItem>
                                            {programs?.map(p => <SelectItem key={p.id} value={p.title} className="font-bold">{p.title}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-4">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Lifecycle Status</Label>
                                    <Select value={learner.status} onValueChange={handleStatusChange}>
                                        <SelectTrigger className="h-14 bg-white/10 border-white/10 text-white rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none font-bold">
                                            <div className="flex items-center gap-2">
                                                <Activity className="h-4 w-4 text-accent" />
                                                <SelectValue placeholder="Update Status" />
                                            </div>
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl border-primary/10">
                                            <SelectItem value="Active" className="font-bold">Active Enrollment</SelectItem>
                                            <SelectItem value="Inactive" className="font-bold">Suspended</SelectItem>
                                            <SelectItem value="Alumni" className="font-bold">Alumni Status</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="mt-12 pt-8 border-t border-white/5 space-y-4">
                                <p className="text-[10px] text-white/40 italic leading-relaxed">Changes to learner metadata are logged for auditing purposes.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function DetailItem({ icon: Icon, label, value, highlight = false }: any) {
    return (
        <div className="flex items-start gap-4">
            <div className="h-10 w-10 shrink-0 flex items-center justify-center rounded-tl-lg rounded-br-lg bg-primary/5 text-accent">
                <Icon className="h-5 w-5" />
            </div>
            <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-primary/40 mb-1">{label}</p>
                <p className={cn("text-base font-bold text-primary", highlight && "text-accent")}>{value || 'Not Defined'}</p>
            </div>
        </div>
    );
}
