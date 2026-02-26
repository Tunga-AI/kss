'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, Plus, RefreshCw, Search, ChevronDown, User as UserIcon, Calendar, Users, Mail, ArrowRight, Edit, Trash2, Shield } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUsersFirestore, useCollection } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import type { User } from '@/lib/user-types';
import { format } from 'date-fns';
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { deleteUser } from '@/lib/users';

export default function AdminUsersPage() {
    const usersFirestore = useUsersFirestore();
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const PAGE_SIZE = 20;

    const usersQuery = useMemo(() => {
        if (!usersFirestore) return null;
        return query(collection(usersFirestore, 'users'));
    }, [usersFirestore]);

    const { data: allUsers, loading } = useCollection<User>(usersQuery as any);

    const filteredUsers = useMemo(() => {
        if (!allUsers) return [];
        return allUsers.filter(u => {
            const matchesSearch = (u.name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
                (u.email?.toLowerCase() || '').includes(searchQuery.toLowerCase());
            const matchesRole = roleFilter === 'all' || u.role === roleFilter;
            return matchesSearch && matchesRole;
        });
    }, [allUsers, searchQuery, roleFilter]);

    const totalPages = Math.ceil(filteredUsers.length / PAGE_SIZE);
    const paginatedUsers = filteredUsers.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

    const handleSearch = (val: string) => { setSearchQuery(val); setCurrentPage(1); };
    const handleRoleFilter = (val: string) => { setRoleFilter(val); setCurrentPage(1); };

    const handleDelete = (id: string) => {
        if (usersFirestore && confirm('Are you sure you want to delete this user profile? This does not delete their authentication account.')) {
            deleteUser(usersFirestore, id);
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
                {/* Users Hero Section */}
                <div className="bg-primary text-white p-6 mb-6 border-b border-primary/10 rounded-tl-3xl rounded-br-3xl rounded-tr-none rounded-bl-none shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-accent/20 rounded-full blur-3xl opacity-20" />

                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <Users className="h-8 w-8 bg-accent/20 p-1.5 rounded-lg" />
                                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Access Management</h1>
                            </div>
                            <p className="text-white/80 text-lg font-medium">Manage user accounts, roles and system permissions</p>
                        </div>
                        <div className="flex items-center gap-3">

                            <Button className="bg-secondary text-white border-none h-12 px-6 rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none font-bold shadow-lg transition-all" asChild>
                                <Link href="/a/users/new">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Create User
                                </Link>
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Filters Row */}
                <div className="flex flex-col lg:flex-row gap-4 mb-6 items-end">
                    <div className="relative flex-1 group w-full">
                        <label className="text-xs font-bold text-primary/40 uppercase tracking-widest ml-1 mb-2 block">Search Users</label>
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary/30 group-focus-within:text-primary transition-colors" />
                            <Input
                                placeholder="Search by name or email..."
                                className="pl-12 h-14 bg-white border-primary/10 rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none focus:ring-primary focus:border-primary shadow-sm text-base font-medium"
                                value={searchQuery}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSearch(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-4 items-end w-full lg:w-auto">
                        <DropdownCard
                            label="Role Filter"
                            value={roleFilter}
                            onChange={(val: string) => handleRoleFilter(val)}
                            options={[
                                { value: 'all', label: 'All Roles' },
                                { value: 'Admin', label: 'Administrator' },
                                { value: 'Learner', label: 'Learner' },
                                { value: 'BusinessLearner', label: 'Business Learner' },
                                { value: 'Facilitator', label: 'Facilitator' }
                            ]}
                            className="w-full sm:w-64"
                        />
                    </div>
                </div>

                {/* Users Table */}
                <div className="w-full bg-white shadow-lg border border-primary/10 overflow-hidden rounded-tl-2xl rounded-br-2xl rounded-tr-none rounded-bl-none">
                    <div className="overflow-x-auto">
                        <Table className="w-full">
                            <TableHeader className="bg-primary/5 border-b border-primary/10">
                                <TableRow className="hover:bg-transparent">
                                    <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest w-12">ID</TableHead>
                                    <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest">User Profile</TableHead>
                                    <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest text-center">Role</TableHead>
                                    <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest text-center">Status</TableHead>
                                    <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest">Date Joined</TableHead>
                                    <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest">Last Login</TableHead>
                                    <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody className="divide-y divide-primary/10">
                                {paginatedUsers.map((user) => (
                                    <TableRow key={user.id} className="hover:bg-primary/5 cursor-pointer transition-colors group border-primary/10">
                                        <TableCell className="px-6 py-4 font-black text-primary/30 text-xs text-center">
                                            #{user.id}
                                        </TableCell>
                                        <TableCell className="px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                <Avatar className="h-10 w-10 rounded-tl-lg rounded-br-lg rounded-tr-none rounded-bl-none border border-primary/5">
                                                    <AvatarImage src={user.avatar} alt={user.name || 'User'} />
                                                    <AvatarFallback className="rounded-none bg-primary/10 text-primary font-bold">
                                                        {(user.name || 'U').charAt(0)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="font-bold text-primary leading-tight">{user.name || 'Unknown User'}</p>
                                                    <div className="flex items-center gap-1 text-[10px] text-primary/60 mt-0.5">
                                                        <Mail className="h-3 w-3" />
                                                        {user.email}
                                                    </div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="px-6 py-4 text-center">
                                            <div className="flex items-center justify-center gap-1.5">
                                                <Shield className={cn("h-3 w-3", user.role === 'Admin' ? "text-accent" : "text-primary/30")} />
                                                <span className="text-sm font-bold text-primary/80">{user.role}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="px-6 py-4 text-center">
                                            <span className={cn(
                                                "inline-flex text-[9px] font-bold uppercase px-2 py-0.5 rounded-tl-sm rounded-br-sm rounded-tr-none rounded-bl-none",
                                                user.status === 'Active' ? 'bg-green-500 text-white' : 'bg-primary/20 text-primary/60'
                                            )}>
                                                {user.status}
                                            </span>
                                        </TableCell>
                                        <TableCell className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-xs text-primary/70">
                                                <Calendar className="h-3 w-3" />
                                                {user.createdAt ? format(typeof (user.createdAt as any).toDate === 'function' ? (user.createdAt as any).toDate() : new Date(user.createdAt as any), 'MMM d, yyyy') : 'N/A'}
                                            </div>
                                        </TableCell>
                                        <TableCell className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-xs text-primary/70">
                                                <Calendar className="h-3 w-3" />
                                                {user.lastLogin ? format(typeof (user.lastLogin as any).toDate === 'function' ? (user.lastLogin as any).toDate() : new Date(user.lastLogin as any), 'MMM d, yyyy HH:mm') : <span className="text-primary/30 italic">Never</span>}
                                            </div>
                                        </TableCell>
                                        <TableCell className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2 transition-opacity">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    asChild
                                                    className="h-8 shadow-none hover:bg-primary/5 rounded-tl-md rounded-br-md rounded-tr-none rounded-bl-none"
                                                >
                                                    <Link href={`/a/users/${user.id}`}>
                                                        <Edit className="h-4 w-4 text-primary" />
                                                    </Link>
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 shadow-none hover:bg-accent/10 hover:text-accent rounded-tl-md rounded-br-md rounded-tr-none rounded-bl-none"
                                                    onClick={(e) => { e.stopPropagation(); handleDelete(user.id); }}
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
                            Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filteredUsers.length)} of {filteredUsers.length} users
                        </p>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="h-8 px-3 rounded-tl-md rounded-br-md rounded-tr-none rounded-bl-none border-primary/10 font-bold text-primary"
                            >
                                Prev
                            </Button>
                            {Array.from({ length: totalPages }, (_, i) => i + 1)
                                .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                                .reduce<(number | '...')[]>((acc, p, idx, arr) => {
                                    if (idx > 0 && (p as number) - (arr[idx - 1] as number) > 1) acc.push('...');
                                    acc.push(p);
                                    return acc;
                                }, [])
                                .map((p, idx) =>
                                    p === '...' ? (
                                        <span key={`ellipsis-${idx}`} className="px-1 text-primary/40 text-sm">…</span>
                                    ) : (
                                        <Button
                                            key={p}
                                            variant={currentPage === p ? 'default' : 'outline'}
                                            size="sm"
                                            onClick={() => setCurrentPage(p as number)}
                                            className="h-8 w-8 p-0 rounded-tl-md rounded-br-md rounded-tr-none rounded-bl-none border-primary/10 font-bold"
                                        >
                                            {p}
                                        </Button>
                                    )
                                )}
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="h-8 px-3 rounded-tl-md rounded-br-md rounded-tr-none rounded-bl-none border-primary/10 font-bold text-primary"
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
