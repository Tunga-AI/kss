'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, RefreshCw, Search, ChevronDown, Building, Calendar, Shield, Briefcase, ExternalLink } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useUsersFirestore, useCollection } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import type { Organization } from '@/lib/organization-types';
import { format } from 'date-fns';
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { where } from 'firebase/firestore';
import type { SaleLead } from '@/lib/sales-types';
import { User, Mail, Phone, Clock } from 'lucide-react';

export default function B2BPage() {
    const firestore = useUsersFirestore();
    const [searchQuery, setSearchQuery] = useState('');

    const orgsQuery = useMemo(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'organizations'), orderBy('createdAt', 'desc'));
    }, [firestore]);

    const { data: allOrgs, loading: orgsLoading } = useCollection<Organization>(orgsQuery as any);

    const leadsQuery = useMemo(() => {
        if (!firestore) return null;
        // Using client-side filtering safely if index is missing for compound query, 
        // but try simple query first. 
        // To be safe against index errors with orderBy, we can fetch all B2B and sort client side if needed, 
        // or just use where. 
        return query(collection(firestore, 'sales'), where('programType', '==', 'B2B'));
    }, [firestore]);

    const { data: allLeads, loading: leadsLoading } = useCollection<SaleLead>(leadsQuery as any);

    // Filter Organizations
    const filteredOrgs = useMemo(() => {
        if (!allOrgs) return [];
        return allOrgs.filter(org => {
            const matchesSearch = org.name.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesSearch;
        });
    }, [allOrgs, searchQuery]);

    // Filter Leads
    const filteredLeads = useMemo(() => {
        if (!allLeads) return [];
        const fullName = (lead: typeof allLeads[number]) => `${lead.firstName || ''} ${lead.lastName || ''}`.trim();
        return allLeads.filter(lead => {
            const matchesSearch = fullName(lead).toLowerCase().includes(searchQuery.toLowerCase()) ||
                (lead.email?.toLowerCase().includes(searchQuery.toLowerCase()) || '') ||
                (lead.programName?.toLowerCase().includes(searchQuery.toLowerCase()) || '');
            return matchesSearch;
        }).sort((a, b) => {
            // Client-side sort by createdAt desc
            const aTime = a.createdAt?.toMillis() || 0;
            const bTime = b.createdAt?.toMillis() || 0;
            return bTime - aTime;
        });
    }, [allLeads, searchQuery]);

    if (orgsLoading || leadsLoading) {
        return (
            <div className="p-8 flex items-center justify-center min-h-screen">
                <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="w-full min-h-screen bg-gray-50/50 p-2 md:p-4 font-body">
            <div className="w-full">
                {/* B2B Hero Section */}
                <div className="bg-primary text-white p-6 mb-6 border-b border-primary/10 rounded-tl-3xl rounded-br-3xl rounded-tr-none rounded-bl-none shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-accent/20 rounded-full blur-3xl opacity-20" />

                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <Briefcase className="h-8 w-8 bg-accent/20 p-1.5 rounded-lg text-accent" />
                                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Corporate Partners</h1>
                            </div>
                            <p className="text-white/80 text-lg font-medium">Manage enterprise client accounts and institutional subscriptions</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <Button
                                className="bg-secondary hover:bg-secondary/90 text-white border-none h-12 px-6 rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none font-bold shadow-lg transition-all"
                                asChild
                            >
                                <Link href="/a/b2b/new">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Create Business
                                </Link>
                            </Button>
                        </div>
                    </div>
                </div>

                <Tabs defaultValue="active" className="w-full">
                    <div className="flex flex-col lg:flex-row gap-4 mb-6 items-end justify-between">
                        <div className="relative flex-1 group w-full max-w-lg">
                            <label className="text-xs font-bold text-primary/40 uppercase tracking-widest ml-1 mb-2 block">Search</label>
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary/30 group-focus-within:text-primary transition-colors" />
                                <Input
                                    placeholder="Search organizations or leads..."
                                    className="pl-12 h-14 bg-white border-primary/10 rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none focus:ring-primary focus:border-primary shadow-sm text-base font-medium"
                                    value={searchQuery}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>

                        <TabsList className="h-14 bg-white border border-primary/10 p-1 rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none">
                            <TabsTrigger value="active" className="h-full px-6 rounded-tl-lg rounded-br-lg rounded-tr-none rounded-bl-none data-[state=active]:bg-primary data-[state=active]:text-white font-bold uppercase tracking-wide">
                                Active Organizations
                            </TabsTrigger>
                            <TabsTrigger value="leads" className="h-full px-6 rounded-tl-lg rounded-br-lg rounded-tr-none rounded-bl-none data-[state=active]:bg-primary data-[state=active]:text-white font-bold uppercase tracking-wide">
                                Business Leads
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value="active" className="mt-0">
                        <div className="w-full bg-white shadow-lg border border-primary/10 overflow-hidden rounded-tl-2xl rounded-br-2xl rounded-tr-none rounded-bl-none">
                            <div className="overflow-x-auto">
                                <Table className="w-full">
                                    <TableHeader className="bg-primary/5 border-b border-primary/10">
                                        <TableRow className="hover:bg-transparent">
                                            <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest">Organization Name</TableHead>
                                            <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest text-center">Plan</TableHead>
                                            <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest text-center">Stage</TableHead>
                                            <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest">Subscription End</TableHead>
                                            <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody className="divide-y divide-primary/10">
                                        {filteredOrgs.map((org) => (
                                            <TableRow key={org.id} className="hover:bg-primary/5 cursor-pointer transition-colors group border-primary/10">
                                                <TableCell className="px-6 py-4">
                                                    <div className="flex items-center gap-4">
                                                        <div className="h-10 w-10 flex items-center justify-center rounded-tl-lg rounded-br-lg bg-primary/10 text-primary/40 group-hover:bg-accent group-hover:text-white transition-all">
                                                            <Building className="h-5 w-5" />
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-primary leading-tight">{org.name}</p>
                                                            <p className="text-[10px] text-primary/40 uppercase font-black mt-1">Institutional Client</p>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="px-6 py-4 text-center">
                                                    <Badge variant="outline" className="border-primary/10 text-primary/60 font-bold text-[9px] uppercase tracking-widest px-3">
                                                        {org.tier}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="px-6 py-4 text-center">
                                                    <Badge className={cn(
                                                        "rounded-tl-sm rounded-br-sm rounded-tr-none rounded-bl-none font-bold text-[9px] uppercase tracking-widest border-none px-3",
                                                        org.status === 'Active' ? 'bg-green-500 text-white' :
                                                            org.status === 'Trial' ? 'bg-accent text-white' :
                                                                'bg-primary/20 text-primary/60'
                                                    )}>
                                                        {org.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="px-6 py-4">
                                                    <div className="flex items-center gap-2 text-xs text-primary/70 font-medium">
                                                        <Calendar className="h-3 w-3 text-accent" />
                                                        {org.subscriptionEndDate ? format(org.subscriptionEndDate.toDate(), 'MMM d, yyyy') : 'N/A'}
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
                                                            <Link href={`/a/b2b/${org.id}`}>
                                                                <ExternalLink className="h-4 w-4 text-primary" />
                                                            </Link>
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {filteredOrgs.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center py-20 text-primary/40 font-bold uppercase tracking-widest">
                                                    No organizations found
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="leads" className="mt-0">
                        <div className="w-full bg-white shadow-lg border border-primary/10 overflow-hidden rounded-tl-2xl rounded-br-2xl rounded-tr-none rounded-bl-none">
                            <div className="overflow-x-auto">
                                <Table className="w-full">
                                    <TableHeader className="bg-primary/5 border-b border-primary/10">
                                        <TableRow className="hover:bg-transparent">
                                            <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest">Contact Info</TableHead>
                                            <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest text-center">Interest Details</TableHead>
                                            <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest text-center">Status</TableHead>
                                            <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest">Date</TableHead>
                                            <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody className="divide-y divide-primary/10">
                                        {filteredLeads.map((lead) => (
                                            <TableRow key={lead.id} className="hover:bg-primary/5 cursor-pointer transition-colors group border-primary/10">
                                                <TableCell className="px-6 py-4">
                                                    <div className="flex items-center gap-4">
                                                        <div className="h-10 w-10 flex items-center justify-center rounded-tl-lg rounded-br-lg bg-primary/10 text-primary/40 group-hover:bg-accent group-hover:text-white transition-all">
                                                            <User className="h-5 w-5" />
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-primary leading-tight">{`${lead.firstName || ''} ${lead.lastName || ''}`.trim() || 'Unknown'}</p>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <span className="flex items-center text-[10px] text-primary/60">
                                                                    <Mail className="h-3 w-3 mr-1" />
                                                                    {lead.email}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="px-6 py-4 text-center">
                                                    <Badge variant="outline" className="border-primary/10 text-primary/60 font-bold text-[9px] uppercase tracking-widest px-3">
                                                        {lead.programName}
                                                    </Badge>
                                                    {lead.currentOrganization && (
                                                        <p className="text-[10px] text-primary/40 mt-1 font-bold">{lead.currentOrganization}</p>
                                                    )}
                                                </TableCell>
                                                <TableCell className="px-6 py-4 text-center">
                                                    <Badge className="bg-orange-500/10 text-orange-600 border-none font-bold text-[9px] uppercase tracking-widest px-3">
                                                        {lead.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="px-6 py-4">
                                                    <div className="flex items-center gap-2 text-xs text-primary/70 font-medium">
                                                        <Clock className="h-3 w-3 text-accent" />
                                                        {lead.createdAt ? format(lead.createdAt.toDate(), 'MMM d, yyyy') : 'N/A'}
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
                                                            <Link href={`/a/customers/${lead.id}`}>
                                                                <ExternalLink className="h-4 w-4 text-primary" />
                                                            </Link>
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {filteredLeads.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center py-20 text-primary/40 font-bold uppercase tracking-widest">
                                                    No business leads found
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
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
