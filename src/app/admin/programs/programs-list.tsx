'use client';

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, Plus, RefreshCw, Search, ChevronDown, BookOpen, Calendar, MapPin, Tag, Users, Edit, Trash2, Eye } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuGroup } from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { useUsersFirestore } from "@/firebase";
import { collection, query, orderBy } from "firebase/firestore";
import { useCollection } from "@/firebase/firestore/use-collection";
import type { Program } from "@/lib/program-types";
import { useMemo, useState } from "react";
import { deleteProgram } from "@/lib/programs";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

export default function AdminProgramsPage() {
    const firestore = useUsersFirestore(); // programs live in kenyasales DB
    const [searchQuery, setSearchQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');

    const programsQuery = useMemo(() => {
        if (!firestore) return null;
        return query(collection(firestore, "programs"), orderBy("createdAt", "desc"));
    }, [firestore]);

    const { data: allPrograms, loading } = useCollection<Program>(programsQuery as any);

    const filteredPrograms = useMemo(() => {
        if (!allPrograms) return [];
        return allPrograms.filter(p => {
            const title = p.programName || p.title || '';
            const desc = p.shortDescription || p.description || '';
            const matchesSearch = title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                desc.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesType = typeFilter === 'all' || p.programType === typeFilter;
            return matchesSearch && matchesType;
        });
    }, [allPrograms, searchQuery, typeFilter]);

    const handleDelete = (id: string) => {
        if (firestore && confirm('Are you sure you want to delete this program?')) {
            deleteProgram(firestore, id);
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
                            <h1 className="text-3xl sm:text-4xl font-bold mb-2 tracking-tight">Programs & Event Management</h1>
                            <p className="text-white/80 text-lg font-medium">Manage all programs, e-learning, corporate engagements and events</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button className="bg-secondary hover:bg-secondary/90 text-white border-none h-12 px-6 rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none font-bold shadow-lg transition-all">
                                        <Plus className="h-4 w-4 mr-2" />
                                        Create New
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none border-primary/10 w-52">
                                    <DropdownMenuLabel className="font-bold text-primary text-[10px] uppercase tracking-widest">Programs</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuGroup>
                                        <DropdownMenuItem asChild>
                                            <Link href="/a/programs/new?type=core" className="font-bold">Core Program</Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem asChild>
                                            <Link href="/a/programs/new?type=shortcourse" className="font-bold">Short Course</Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem asChild>
                                            <Link href="/a/programs/new?type=elearning" className="font-bold">E-Learning</Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem asChild>
                                            <Link href="/a/programs/new?type=corporate" className="font-bold">Corporate Program</Link>
                                        </DropdownMenuItem>
                                    </DropdownMenuGroup>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuLabel className="font-bold text-primary text-[10px] uppercase tracking-widest">Events</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem asChild>
                                        <Link href="/a/events/new" className="font-bold">Create Event</Link>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                </div>

                {/* Filters Row */}
                <div className="flex flex-col lg:flex-row gap-4 mb-6 items-end">
                    <div className="relative flex-1 group w-full">
                        <label className="text-xs font-bold text-primary/40 uppercase tracking-widest ml-1 mb-2 block">Admin Search</label>
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary/30 group-focus-within:text-primary transition-colors" />
                            <Input
                                placeholder="Search by title, description or slug..."
                                className="pl-12 h-14 bg-white border-primary/10 rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none focus:ring-primary focus:border-primary shadow-sm text-base font-medium"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-4 items-end w-full lg:w-auto">
                        <DropdownCard
                            label="Filter By Type"
                            value={typeFilter}
                            onChange={(val: string) => setTypeFilter(val)}
                            options={[
                                { value: 'all', label: 'All Types' },
                                { value: 'Core', label: 'Core Programs' },
                                { value: 'Short', label: 'Short Courses' },
                                { value: 'E-Learning', label: 'E-Learning' },
                                { value: 'Event', label: 'Events' },
                                { value: 'Corporate', label: 'Corporate' },
                            ]}
                            className="w-full sm:w-64"
                        />
                    </div>
                </div>

                {/* Programs Table */}
                <div className="w-full bg-white shadow-lg border border-primary/10 overflow-hidden rounded-tl-2xl rounded-br-2xl rounded-tr-none rounded-bl-none">
                    <div className="overflow-x-auto">
                        <Table className="w-full">
                            <TableHeader className="bg-primary/5 border-b border-primary/10">
                                <TableRow className="hover:bg-transparent">
                                    <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest w-12">ID</TableHead>
                                    <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest">Program Details</TableHead>
                                    <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest text-center">Type</TableHead>
                                    <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest text-center">Info</TableHead>
                                    <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest text-center">Program Format</TableHead>
                                    <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest">Price</TableHead>
                                    <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody className="divide-y divide-primary/10">
                                {filteredPrograms.map((program) => {
                                    const title = program.programName || program.title || 'Untitled';
                                    const description = program.shortDescription || program.description || '';
                                    const price = program.price ? (typeof program.price === 'number' ? `KES ${program.price.toLocaleString()}` : program.price) : 'Free';

                                    return (
                                        <TableRow key={program.id} className="hover:bg-primary/5 cursor-pointer transition-colors group border-primary/10">
                                            <TableCell className="px-6 py-4 font-black text-primary text-xs text-center">
                                                {program.programNumber || '—'}
                                            </TableCell>
                                            <TableCell className="px-6 py-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-10 w-10 flex items-center justify-center rounded-tl-lg rounded-br-lg rounded-tr-none rounded-bl-none bg-primary/10 border border-primary/5">
                                                        <BookOpen className="h-5 w-5 text-primary/40" />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-primary leading-tight line-clamp-1">{title}</p>
                                                        <div className="flex items-center gap-1 text-[10px] text-primary/60 mt-0.5 uppercase tracking-tighter line-clamp-1 max-w-[300px]">
                                                            <MapPin className="h-3 w-3" />
                                                            {(program as any).location || 'Online'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="px-6 py-4 text-center">
                                                <span className={cn(
                                                    "inline-flex text-[9px] font-bold uppercase px-2 py-0.5 rounded-tl-sm rounded-br-sm rounded-tr-none rounded-bl-none",
                                                    program.programType === 'Event' ? 'bg-accent/10 text-accent' : 'bg-primary/10 text-primary'
                                                )}>
                                                    {program.programType || 'Standard'}
                                                </span>
                                            </TableCell>
                                            <TableCell className="px-6 py-4 text-center">
                                                <div className="flex flex-col items-center gap-1">
                                                    <div className="flex items-center gap-1 text-[10px] font-bold text-primary/70">
                                                        <Users className="h-3 w-3" />
                                                        {program.level ? `Level ${program.level}` : 'Beginner'}
                                                    </div>
                                                    {(program as any).date && (
                                                        <div className="flex items-center gap-1 text-[9px] text-primary/40">
                                                            <Calendar className="h-3 w-3" />
                                                            {format(new Date((program as any).date), 'MMM d, yyyy')}
                                                        </div>
                                                    )}
                                                    {!((program as any).date) && program.intakes && program.intakes.length > 0 && program.intakes[0].startDate && (
                                                        <div className="flex items-center gap-1 text-[9px] text-primary/40">
                                                            <Calendar className="h-3 w-3" />
                                                            {/* Handle Timestamp or Date string */}
                                                            {(() => {
                                                                const d = program.intakes[0].startDate;
                                                                // Check if it has toDate (Firestore Timestamp)
                                                                const dateObj = (d as any).toDate ? (d as any).toDate() : new Date(d as any);
                                                                return !isNaN(dateObj.getTime()) ? format(dateObj, 'MMM d, yyyy') : '';
                                                            })()}
                                                        </div>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="px-6 py-4 text-center">
                                                <div className="flex flex-col items-center">
                                                    <span className="text-[10px] font-medium text-primary/80 line-clamp-2 max-w-[150px]">
                                                        {Array.isArray(program.programFormat) ? program.programFormat.join(', ') : (program.programFormat || '—')}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="px-6 py-4">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2 text-xs font-bold text-primary">
                                                        <Tag className="h-3 w-3 text-accent" />
                                                        {price}
                                                    </div>
                                                    {program.admissionCost ? (
                                                        <div className="flex items-center gap-2 text-[10px] text-accent font-bold">
                                                            <Tag className="h-3 w-3" />
                                                            Adm: {program.currency || 'KES'} {Number(program.admissionCost).toLocaleString()}
                                                        </div>
                                                    ) : null}
                                                </div>
                                            </TableCell>
                                            <TableCell className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        asChild
                                                        className="h-8 shadow-none hover:bg-primary/5 rounded-tl-md rounded-br-md rounded-tr-none rounded-bl-none"
                                                        title="View"
                                                    >
                                                        <Link href={`/a/programs/${program.id}/view`}>
                                                            <Eye className="h-4 w-4 text-primary/60" />
                                                        </Link>
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        asChild
                                                        className="h-8 shadow-none hover:bg-primary/5 rounded-tl-md rounded-br-md rounded-tr-none rounded-bl-none"
                                                        title="Edit"
                                                    >
                                                        <Link href={`/a/programs/${program.id}`}>
                                                            <Edit className="h-4 w-4 text-primary" />
                                                        </Link>
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 shadow-none hover:bg-accent/10 hover:text-accent rounded-tl-md rounded-br-md rounded-tr-none rounded-bl-none"
                                                        title="Delete"
                                                        onClick={(e) => { e.stopPropagation(); handleDelete(program.id); }}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
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
