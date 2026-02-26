'use client';
import { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, Plus, RefreshCw, Search, ChevronDown, User as UserIcon, Calendar, Edit, Trash2, Mail } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUsersFirestore, useCollection } from '@/firebase';
import { collection, query, getDocs } from 'firebase/firestore';
import type { Learner } from '@/lib/learners-types';
import type { Admission } from '@/lib/admission-types';
import { deleteLearner } from '@/lib/learners';
import { format } from 'date-fns';
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

type LearnerWithAdmission = Learner & {
    cohortId?: string;
    cohortName?: string;
    recommendedProgramTitle?: string;
    placementDate?: Date | null;
};

const PAGE_SIZE = 20;

export default function AdminLearnersPage() {
    const firestore = useUsersFirestore();
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [learnersWithAdmissions, setLearnersWithAdmissions] = useState<LearnerWithAdmission[]>([]);
    const [currentPage, setCurrentPage] = useState(1);

    const learnersQuery = useMemo(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'learners'));
    }, [firestore]);

    const { data: allLearners, loading: learnersLoading } = useCollection<Learner>(learnersQuery as any);

    // Fetch admissions, cohorts and programs to enrich learner rows
    useEffect(() => {
        const fetchAdmissionsAndCohorts = async () => {
            if (!firestore || !allLearners) return;

            try {
                // Fetch admissions
                const admissionsSnapshot = await getDocs(collection(firestore, 'admissions'));
                const admissionsMap = new Map<string, Admission>();
                admissionsSnapshot.docs.forEach(doc => {
                    const admission = { id: doc.id, ...doc.data() } as Admission;
                    admissionsMap.set(admission.userId, admission);
                });

                // Fetch cohorts to get names
                const cohortsSnapshot = await getDocs(collection(firestore, 'cohorts'));
                const cohortsMap = new Map<string, string>();
                cohortsSnapshot.docs.forEach(doc => {
                    cohortsMap.set(doc.id, doc.data().name || doc.id);
                });

                // Fetch programs to resolve IDs → names
                const programsSnapshot = await getDocs(collection(firestore, 'programs'));
                const programsMap = new Map<string, string>();
                programsSnapshot.docs.forEach(doc => {
                    const d = doc.data();
                    programsMap.set(doc.id, d.programName || d.title || doc.id);
                });

                const enrichedLearners = allLearners.map(learner => {
                    const admission = admissionsMap.get(learner.id);

                    // Prefer final placement data from admission
                    const finalCohortId = admission?.finalCohortId || admission?.cohortId || (learner as any).cohortId;
                    const cohortName = admission?.finalCohortTitle ||
                        ((finalCohortId && finalCohortId !== 'PENDING_ASSIGNMENT')
                            ? (cohortsMap.get(finalCohortId) || (learner as any).cohortName || finalCohortId)
                            : ((learner as any).cohortName || undefined));

                    // Resolve program name from admission or directly stored programId
                    const programId = admission?.finalProgramId || admission?.recommendedProgramId || (learner as any).program;
                    const recommendedProgramTitle = admission?.finalProgramTitle
                        || admission?.recommendedProgramTitle
                        || (programId ? programsMap.get(programId) : undefined)
                        || undefined;

                    // Determine original placement date from admission if available
                    let placementDate: Date | null = null;
                    if (admission && (admission.status === 'Placed' || admission.status === 'Admitted')) {
                        placementDate = admission.updatedAt ? admission.updatedAt.toDate() : (admission.createdAt ? admission.createdAt.toDate() : null);
                    } else if (learner.joinedDate) {
                        placementDate = new Date(learner.joinedDate);
                    }

                    return {
                        ...learner,
                        cohortId: finalCohortId,
                        cohortName,
                        recommendedProgramTitle,
                        placementDate
                    };
                });

                setLearnersWithAdmissions(enrichedLearners);
            } catch (error) {
                console.error('Error fetching admissions and cohorts:', error);
                setLearnersWithAdmissions(allLearners);
            }
        };

        fetchAdmissionsAndCohorts();
    }, [firestore, allLearners]);

    const loading = learnersLoading || (allLearners && learnersWithAdmissions.length === 0);

    const filteredLearners = useMemo(() => {
        if (!learnersWithAdmissions) return [];
        return learnersWithAdmissions.filter(l => {
            const matchesSearch = (l.name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
                (l.email?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
                (l.program?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
                (l.recommendedProgramTitle?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
                (l.cohortName?.toLowerCase() || '').includes(searchQuery.toLowerCase());
            const matchesStatus = statusFilter === 'all' || l.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [learnersWithAdmissions, searchQuery, statusFilter]);

    // Reset to page 1 whenever filters change
    const totalPages = Math.ceil(filteredLearners.length / PAGE_SIZE);
    const pagedLearners = filteredLearners.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

    const handleDelete = (id: string) => {
        if (firestore && confirm('Are you sure you want to remove this learner profile? This will not delete their main user account.')) {
            deleteLearner(firestore, id);
        }
    };

    if (loading) {
        return (
            <div className="p-8 flex items-center justify-center min-h-screen">
                <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="w-full min-h-screen bg-gray-50/50 p-2 md:p-4 font-body">
            <div className="w-full">
                {/* Admin Hero Section */}
                <div className="bg-primary text-white p-6 mb-6 border-b border-primary/10 rounded-tl-3xl rounded-br-3xl rounded-tr-none rounded-bl-none shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-accent/20 rounded-full blur-3xl opacity-20" />

                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                        <div>
                            <h1 className="text-3xl sm:text-4xl font-bold mb-2 tracking-tight">Learners Management</h1>
                            <p className="text-white/80 text-lg font-medium">Oversee and manage all learners across the ecosystem</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <Button className="bg-secondary hover:bg-secondary/90 text-white border-none h-12 px-6 rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none font-bold shadow-lg transition-all" asChild>
                                <Link href="/a/learners/new">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Learner
                                </Link>
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Filters Row */}
                <div className="flex flex-col lg:flex-row gap-4 mb-6 items-end">
                    <div className="relative flex-1 group w-full">
                        <label className="text-xs font-bold text-primary/40 uppercase tracking-widest ml-1 mb-2 block">Search Learners</label>
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary/30 group-focus-within:text-primary transition-colors" />
                            <Input
                                placeholder="Search by name, email or program..."
                                className="pl-12 h-14 bg-white border-primary/10 rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none focus:ring-primary focus:border-primary shadow-sm text-base font-medium"
                                value={searchQuery}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                            />
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-4 items-end w-full lg:w-auto">
                        <DropdownCard
                            label="Status Filter"
                            value={statusFilter}
                            onChange={(val: string) => { setStatusFilter(val); setCurrentPage(1); }}
                            options={[
                                { value: 'all', label: 'All Status' },
                                { value: 'Active', label: 'Active' },
                                { value: 'Inactive', label: 'Inactive' }
                            ]}
                            className="w-full sm:w-64"
                        />
                    </div>
                </div>

                {/* Learners Table */}
                <div className="w-full bg-white shadow-lg border border-primary/10 overflow-hidden rounded-tl-2xl rounded-br-2xl rounded-tr-none rounded-bl-none">
                    <div className="overflow-x-auto">
                        <Table className="w-full">
                            <TableHeader className="bg-primary/5 border-b border-primary/10">
                                <TableRow className="hover:bg-transparent">
                                    <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest w-12">ID</TableHead>
                                    <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest">Learner Profile</TableHead>
                                    <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest text-center">Intake</TableHead>
                                    <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest text-center">Program</TableHead>
                                    <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest text-center">Status</TableHead>
                                    <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest">Placement Date</TableHead>
                                    <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>

                            <TableBody className="divide-y divide-primary/10">
                                {pagedLearners.map((learner) => (
                                    <TableRow key={learner.id} className="hover:bg-primary/5 cursor-pointer transition-colors group border-primary/10">
                                        <TableCell className="px-6 py-4 font-black text-primary/30 text-xs text-center">
                                            #{learner.id}
                                        </TableCell>
                                        <TableCell className="px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                <Avatar className="h-10 w-10 rounded-tl-lg rounded-br-lg rounded-tr-none rounded-bl-none border border-primary/5">
                                                    <AvatarImage src={learner.avatar} alt={learner.name || 'User'} />
                                                    <AvatarFallback className="rounded-none bg-primary/10 text-primary font-bold">
                                                        {(learner.name || 'U').charAt(0)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="font-bold text-primary leading-tight">{learner.name || 'Unknown User'}</p>
                                                    <div className="flex items-center gap-1 text-[10px] text-primary/60 mt-0.5">
                                                        <Mail className="h-3 w-3" />
                                                        {learner.email}
                                                    </div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="px-6 py-4">
                                            <div className="flex flex-col items-center gap-1.5">
                                                {learner.cohortName ? (
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-[9px] font-bold text-green-600/60 uppercase tracking-wider">Placed:</span>
                                                        <span className="text-xs font-bold text-green-600">{learner.cohortName}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-primary/40">Not Placed</span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="px-6 py-4">
                                            <div className="flex flex-col items-center gap-1.5">
                                                {learner.recommendedProgramTitle ? (
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-[9px] font-bold text-green-600/60 uppercase tracking-wider">Placed:</span>
                                                        <span className="text-xs font-bold text-green-600 text-center">{learner.recommendedProgramTitle}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-primary/40">Not Placed</span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="px-6 py-4 text-center">
                                            <span className={cn(
                                                "inline-flex text-[9px] font-bold uppercase px-2 py-0.5 rounded-tl-sm rounded-br-sm rounded-tr-none rounded-bl-none",
                                                learner.status === 'Active' ? 'bg-green-500 text-white' : 'bg-primary/20 text-primary/60'
                                            )}>
                                                {learner.status}
                                            </span>
                                        </TableCell>
                                        <TableCell className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-xs text-primary/70">
                                                <Calendar className="h-3 w-3" />
                                                {learner.placementDate ? format(learner.placementDate, 'MMM d, yyyy') : 'N/A'}
                                            </div>
                                        </TableCell>
                                        <TableCell className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2  transition-opacity">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    asChild
                                                    className="h-8 shadow-none hover:bg-primary/5 rounded-tl-md rounded-br-md rounded-tr-none rounded-bl-none"
                                                >
                                                    <Link href={`/a/learners/${learner.id}`}>
                                                        <Edit className="h-4 w-4 text-primary" />
                                                    </Link>
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 shadow-none hover:bg-accent/10 hover:text-accent rounded-tl-md rounded-br-md rounded-tr-none rounded-bl-none"
                                                    onClick={(e) => { e.stopPropagation(); handleDelete(learner.id); }}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4 px-2">
                        <p className="text-xs text-primary/50 font-medium">
                            Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filteredLearners.length)} of {filteredLearners.length} learners
                        </p>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                className="rounded-tl-lg rounded-br-lg rounded-tr-none rounded-bl-none border-primary/20 text-primary font-bold"
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                            >
                                Previous
                            </Button>
                            <span className="text-xs font-bold text-primary px-2">
                                Page {currentPage} of {totalPages}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                className="rounded-tl-lg rounded-br-lg rounded-tr-none rounded-bl-none border-primary/20 text-primary font-bold"
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function DropdownCard({ label, value, onChange, options, className }: any) {
    return (
        <div className={`flex flex-col gap-2 ${className}`}>
            <label className="text-xs font-bold text-primary/40 uppercase tracking-widest ml-1">{label}</label>
            <div className="relative group">
                <select
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-full appearance-none bg-white border border-primary/10 rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none px-4 py-2 text-sm md:text-base font-bold text-primary focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all cursor-pointer shadow-sm h-14"
                >
                    {options.map((opt: any) => (
                        <option key={opt.value} value={opt.value} className="font-medium">{opt.label}</option>
                    ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                    <ChevronDown className="h-4 w-4 text-primary/30 group-hover:text-primary transition-colors" />
                </div>
            </div>
        </div>
    );
}
