'use client';
import { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { FolderKanban, RefreshCw, Search, ChevronDown, User as UserIcon, Calendar, Filter, Mail, ArrowRight } from "lucide-react";
import { useUsersFirestore, useCollection, useUser } from '@/firebase';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import type { Admission } from '@/lib/admission-types';
import { format } from 'date-fns';
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

type AdmissionWithCohortName = Admission & {
    cohortName?: string;
};

export default function StaffAdmissionsPage() {
    const firestore = useUsersFirestore();
    const { user } = useUser();
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [admissionsWithCohorts, setAdmissionsWithCohorts] = useState<AdmissionWithCohortName[]>([]);
    const [allowedCohortIds, setAllowedCohortIds] = useState<Set<string>>(new Set());

    const admissionsQuery = useMemo(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'admissions'), orderBy('createdAt', 'desc'));
    }, [firestore]);

    const { data: allAdmissions, loading: admissionsLoading } = useCollection<Admission>(admissionsQuery as any);

    // Fetch cohorts to get names and check facilitator access
    useEffect(() => {
        const fetchCohorts = async () => {
            if (!firestore || !allAdmissions || !user?.id) return;

            try {
                const cohortsSnapshot = await getDocs(collection(firestore, 'cohorts'));
                const cohortsMap = new Map<string, string>();
                const allowed = new Set<string>();

                cohortsSnapshot.docs.forEach(doc => {
                    const cohortData = doc.data();
                    cohortsMap.set(doc.id, cohortData.name || doc.id);

                    // Check if current user is in council or instructors
                    const council = cohortData.council || [];
                    const instructors = cohortData.instructors || [];
                    if (council.includes(user.id) || instructors.includes(user.id)) {
                        allowed.add(doc.id);
                    }
                });

                setAllowedCohortIds(allowed);

                const enrichedAdmissions = allAdmissions
                    // .filter(admission => allowed.has(admission.cohortId || '')) // TEMPORARY: show all applicants
                    .map(admission => {
                        const cohortName = admission.cohortId && admission.cohortId !== 'PENDING_ASSIGNMENT'
                            ? cohortsMap.get(admission.cohortId) || admission.cohortId
                            : undefined;

                        return {
                            ...admission,
                            cohortName,
                        };
                    });

                setAdmissionsWithCohorts(enrichedAdmissions);
            } catch (error) {
                console.error('Error fetching cohorts:', error);
            }
        };

        fetchCohorts();
    }, [firestore, allAdmissions, user?.id]);

    const loading = admissionsLoading || (!allAdmissions && false);

    const filteredAdmissions = useMemo(() => {
        if (!admissionsWithCohorts) return [];
        return admissionsWithCohorts.filter(a => {
            const matchesSearch = a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                a.email.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesStatus = statusFilter === 'all' || a.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [admissionsWithCohorts, searchQuery, statusFilter]);


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
                {/* Admissions Hero Section */}
                <div className="bg-primary text-white p-6 mb-6 border-b border-primary/10 rounded-tl-3xl rounded-br-3xl rounded-tr-none rounded-bl-none shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-accent/20 rounded-full blur-3xl opacity-20" />

                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <FolderKanban className="h-8 w-8 bg-accent/20 p-1.5 rounded-lg text-accent" />
                                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Assigned Admissions</h1>
                            </div>
                            <p className="text-white/80 text-lg font-medium">Review and manage applicants for your assigned cohorts</p>
                        </div>
                        <div className="flex items-center gap-3">

                        </div>
                    </div>
                </div>

                {/* Filters Row */}
                <div className="flex flex-col lg:flex-row gap-4 mb-6 items-end">
                    <div className="relative flex-1 group w-full">
                        <label className="text-xs font-bold text-primary/40 uppercase tracking-widest ml-1 mb-2 block">Search Applicants</label>
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary/30 group-focus-within:text-primary transition-colors" />
                            <Input
                                placeholder="Search by name or email..."
                                className="pl-12 h-14 bg-white border-primary/10 rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none focus:ring-primary focus:border-primary shadow-sm text-base font-medium"
                                value={searchQuery}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-4 items-end w-full lg:w-auto">
                        <DropdownCard
                            label="Application Status"
                            value={statusFilter}
                            onChange={(val: string) => setStatusFilter(val)}
                            options={[
                                { value: 'all', label: 'All Status' },
                                { value: 'Pending Payment', label: 'Pending Payment' },
                                { value: 'Pending Assessment', label: 'Pending Assessment' },
                                { value: 'Pending Review', label: 'Pending Review' },
                                { value: 'Placed', label: 'Placed' },
                                { value: 'Admitted', label: 'Admitted' },
                                { value: 'Rejected', label: 'Rejected' }
                            ]}
                            className="w-full sm:w-64"
                        />
                    </div>
                </div>

                {/* Admissions Table */}
                <div className="w-full bg-white shadow-lg border border-primary/10 overflow-hidden rounded-tl-2xl rounded-br-2xl rounded-tr-none rounded-bl-none">
                    <div className="overflow-x-auto">
                        <Table className="w-full">
                            <TableHeader className="bg-primary/5 border-b border-primary/10">
                                <TableRow className="hover:bg-transparent">
                                    <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest w-12">ID</TableHead>
                                    <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest">Applicant Profile</TableHead>
                                    <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest text-center">Status</TableHead>
                                    <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest text-center">Intake</TableHead>
                                    <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest text-center">Program</TableHead>
                                    <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest">Applied Date</TableHead>
                                    <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody className="divide-y divide-primary/10">
                                {filteredAdmissions.map((admission) => (
                                    <TableRow key={admission.id} className="hover:bg-primary/5 cursor-pointer transition-colors group border-primary/10">
                                        <TableCell className="px-6 py-4 font-black text-primary/30 text-xs text-center">
                                            #{admission.id}
                                        </TableCell>
                                        <TableCell className="px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 flex items-center justify-center rounded-tl-lg rounded-br-lg rounded-tr-none rounded-bl-none bg-primary/10 border border-primary/5">
                                                    <UserIcon className="h-5 w-5 text-primary/40" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-primary leading-tight">{admission.name}</p>
                                                    <div className="flex items-center gap-1 text-[10px] text-primary/60 mt-0.5">
                                                        <Mail className="h-3 w-3" />
                                                        {admission.email}
                                                    </div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="px-6 py-4 text-center">
                                            <span className={cn(
                                                "inline-flex text-[9px] font-bold uppercase px-2 py-0.5 rounded-tl-sm rounded-br-sm rounded-tr-none rounded-bl-none",
                                                admission.status === 'Admitted' || admission.status === 'Placed' ? 'bg-green-500 text-white' :
                                                    admission.status === 'Rejected' ? 'bg-accent text-white' :
                                                        'bg-primary/20 text-primary/60'
                                            )}>
                                                {admission.status}
                                            </span>
                                        </TableCell>
                                        <TableCell className="px-6 py-4">
                                            <div className="flex flex-col items-center gap-1.5">
                                                {admission.cohortName && (
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-[9px] font-bold text-primary/40 uppercase tracking-wider">Applied:</span>
                                                        <span className="text-xs text-primary/70">{admission.cohortName}</span>
                                                    </div>
                                                )}
                                                {admission.finalCohortTitle && (
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-[9px] font-bold text-green-600/60 uppercase tracking-wider">Placed:</span>
                                                        <span className="text-xs font-bold text-green-600">{admission.finalCohortTitle}</span>
                                                    </div>
                                                )}
                                                {!admission.cohortName && !admission.finalCohortTitle && (
                                                    <span className="text-xs text-primary/40">Not Placed</span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="px-6 py-4">
                                            <div className="flex flex-col items-center gap-1.5">
                                                {admission.interestedProgramTitle && (
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-[9px] font-bold text-primary/40 uppercase tracking-wider">Applied:</span>
                                                        <span className="text-xs text-primary/70">{admission.interestedProgramTitle}</span>
                                                    </div>
                                                )}
                                                {(admission.finalProgramTitle || admission.recommendedProgramTitle || admission.recommendedProgramId) && (
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-[9px] font-bold text-green-600/60 uppercase tracking-wider">Placed:</span>
                                                        <span className="text-xs font-bold text-green-600">
                                                            {admission.finalProgramTitle || admission.recommendedProgramTitle || admission.recommendedProgramId}
                                                        </span>
                                                    </div>
                                                )}
                                                {!admission.interestedProgramTitle && !admission.finalProgramTitle && !admission.recommendedProgramTitle && !admission.recommendedProgramId && (
                                                    <span className="text-xs text-primary/40">Not Placed</span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-xs text-primary/70">
                                                <Calendar className="h-3 w-3" />
                                                {admission.createdAt ? format(admission.createdAt.toDate(), 'MMM d, yyyy') : 'N/A'}
                                            </div>
                                        </TableCell>
                                        <TableCell className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    asChild
                                                    className="h-8 shadow-none hover:bg-primary/5 rounded-tl-md rounded-br-md rounded-tr-none rounded-bl-none transition-opacity"
                                                >
                                                    <Link href={`/f/admissions/${admission.id}`}>
                                                        <span className="flex items-center font-bold text-primary">
                                                            Review <ArrowRight className="h-3 w-3 ml-1" />
                                                        </span>
                                                    </Link>
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {filteredAdmissions.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-20 text-primary/40 font-bold uppercase tracking-widest">
                                            {allAdmissions?.length === 0 ? 'No applications found' : 'No applications found matching your criteria'}
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
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
