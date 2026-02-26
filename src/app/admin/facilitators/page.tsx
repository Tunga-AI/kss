'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, RefreshCw, Search, User as UserIcon, Calendar, Edit, Eye, Trash2, Mail, ShieldCheck } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUsersFirestore, useCollection } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import type { User } from '@/lib/user-types';
import { format } from 'date-fns';
import { deleteUser } from '@/lib/users';
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import type { LearningModule } from '@/lib/learning-types';
import type { Cohort } from '@/lib/cohort-types';

export default function AdminFacilitatorsPage() {
    const firestore = useUsersFirestore();
    const [searchQuery, setSearchQuery] = useState('');

    const facilitatorsQuery = useMemo(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'users'), where('role', '==', 'Facilitator'));
    }, [firestore]);

    const { data: allFacilitators, loading } = useCollection<User>(facilitatorsQuery as any);

    const unitsQuery = useMemo(() => firestore ? query(collection(firestore, 'learningUnits')) : null, [firestore]);
    const { data: allUnits } = useCollection<LearningModule>(unitsQuery as any);

    const cohortsQuery = useMemo(() => firestore ? query(collection(firestore, 'cohorts')) : null, [firestore]);
    const { data: allCohorts } = useCollection<Cohort>(cohortsQuery as any);

    const filteredFacilitators = useMemo(() => {
        if (!allFacilitators) return [];
        return allFacilitators
            .filter(f => {
                const matchesSearch = f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    f.email.toLowerCase().includes(searchQuery.toLowerCase());
                return matchesSearch;
            })
            .sort((a, b) => {
                const numA = parseInt(a.id.replace(/\D/g, ''), 10) || 0;
                const numB = parseInt(b.id.replace(/\D/g, ''), 10) || 0;
                return numA - numB;
            });
    }, [allFacilitators, searchQuery]);

    const handleDelete = (id: string) => {
        if (firestore && confirm('Are you sure you want to delete this facilitator profile? This does not delete their authentication account.')) {
            deleteUser(firestore, id);
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
                {/* Facilitators Hero Section */}
                <div className="bg-primary text-white p-6 mb-6 border-b border-primary/10 rounded-tl-3xl rounded-br-3xl rounded-tr-none rounded-bl-none shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-accent/20 rounded-full blur-3xl opacity-20" />

                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <ShieldCheck className="h-8 w-8 bg-accent/20 p-1.5 rounded-lg text-accent" />
                                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Academic Staff</h1>
                            </div>
                            <p className="text-white/80 text-lg font-medium">Manage facilitators, instructors and subject matter experts</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <Button className="bg-secondary hover:bg-secondary/90 text-white border-none h-12 px-6 rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none font-bold shadow-lg transition-all" asChild>
                                <Link href="/a/facilitators/new">
                                    <Plus className="h-4 w-4 mr-2" />
                                    New Facilitator
                                </Link>
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Search Row */}
                <div className="flex flex-col lg:flex-row gap-4 mb-6 items-end">
                    <div className="relative flex-1 group w-full">
                        <label className="text-xs font-bold text-primary/40 uppercase tracking-widest ml-1 mb-2 block">Search Staff</label>
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
                </div>

                {/* Facilitators Table */}
                <div className="w-full bg-white shadow-lg border border-primary/10 overflow-hidden rounded-tl-2xl rounded-br-2xl rounded-tr-none rounded-bl-none">
                    <div className="overflow-x-auto">
                        <Table className="w-full">
                            <TableHeader className="bg-primary/5 border-b border-primary/10">
                                <TableRow className="hover:bg-transparent">
                                    <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest w-12">ID</TableHead>
                                    <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest">Facilitator Profile</TableHead>
                                    <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest text-center">Status</TableHead>
                                    <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest text-center">Committees</TableHead>
                                    <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest text-center">Assigned Units</TableHead>
                                    <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest">Date Boarded</TableHead>
                                    <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody className="divide-y divide-primary/10">
                                {filteredFacilitators.map((user) => (
                                    <TableRow key={user.id} className="hover:bg-primary/5 cursor-pointer transition-colors group border-primary/10">
                                        <TableCell className="px-6 py-4 font-black text-primary/30 text-xs text-center">
                                            #{user.id}
                                        </TableCell>
                                        <TableCell className="px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                <Avatar className="h-10 w-10 rounded-tl-lg rounded-br-lg rounded-tr-none rounded-bl-none border border-primary/5">
                                                    <AvatarImage src={user.avatar} alt={user.name} />
                                                    <AvatarFallback className="rounded-none bg-primary/10 text-primary font-bold">
                                                        {user.name.charAt(0)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="font-bold text-primary leading-tight">{user.name}</p>
                                                    <div className="flex items-center gap-1 text-[10px] text-primary/60 mt-0.5">
                                                        <Mail className="h-3 w-3" />
                                                        {user.email}
                                                    </div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="px-6 py-4 text-center">
                                            <Badge className={cn(
                                                "rounded-tl-sm rounded-br-sm rounded-tr-none rounded-bl-none font-bold text-[9px] uppercase tracking-widest border-none px-3",
                                                user.status === 'Active' ? 'bg-green-500 text-white' : 'bg-primary/20 text-primary/60'
                                            )}>
                                                {user.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="px-6 py-4 text-center">
                                            {allCohorts ? (
                                                <Badge variant="outline" className="font-bold text-[10px] bg-blue-50 text-blue-700 border-none">
                                                    {allCohorts.filter(c => c.council?.includes(user.id)).length} Intakes
                                                </Badge>
                                            ) : (
                                                <span className="text-xs text-gray-400">...</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="px-6 py-4 text-center">
                                            {allUnits ? (
                                                <Badge variant="outline" className="font-bold text-[10px] bg-purple-50 text-purple-700 border-none">
                                                    {allUnits.filter(u => u.facilitatorId === user.id).length} Units
                                                </Badge>
                                            ) : (
                                                <span className="text-xs text-gray-400">...</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-xs text-primary/70 font-medium">
                                                <Calendar className="h-3 w-3 text-accent" />
                                                {user.createdAt ? format(user.createdAt.toDate(), 'MMM d, yyyy') : 'N/A'}
                                            </div>
                                        </TableCell>
                                        <TableCell className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2 transition-opacity">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    asChild
                                                    className="h-8 shadow-none hover:bg-green-500 hover:text-white rounded-tl-md rounded-br-md rounded-tr-none rounded-bl-none"
                                                    title="View"
                                                >
                                                    <Link href={`/a/facilitators/${user.id}`}>
                                                        <Eye className="h-4 w-4" />
                                                    </Link>
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    asChild
                                                    className="h-8 shadow-none hover:bg-primary/5 rounded-tl-md rounded-br-md rounded-tr-none rounded-bl-none"
                                                    title="Edit"
                                                >
                                                    <Link href={`/a/facilitators/${user.id}`}>
                                                        <Edit className="h-4 w-4 text-primary" />
                                                    </Link>
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 shadow-none hover:bg-accent/10 hover:text-accent rounded-tl-md rounded-br-md rounded-tr-none rounded-bl-none"
                                                    title="Delete"
                                                    onClick={(e) => { e.stopPropagation(); handleDelete(user.id); }}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {filteredFacilitators.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-20 text-primary/40 font-bold uppercase tracking-widest">
                                            No facilitators found in staff record
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
