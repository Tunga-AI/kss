'use client';

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, RefreshCw, Search, Calendar, MapPin, Tag, Edit, Trash2, Eye } from "lucide-react";
import { format } from "date-fns";
import { useUsersFirestore } from "@/firebase";
import { collection, query, orderBy } from "firebase/firestore";
import { useCollection } from "@/firebase/firestore/use-collection";
import type { Event } from "@/lib/event-types";
import { useMemo, useState } from "react";
import { deleteEvent } from "@/lib/events";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

export default function AdminEventsPage() {
    const firestore = useUsersFirestore();
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    const eventsQuery = useMemo(() => {
        if (!firestore) return null;
        return query(collection(firestore, "events"), orderBy("createdAt", "desc"));
    }, [firestore]);

    const { data: allEvents, loading } = useCollection<Event>(eventsQuery as any);

    const filteredEvents = useMemo(() => {
        if (!allEvents) return [];
        return allEvents.filter(e => {
            const title = e.title || '';
            const desc = e.shortDescription || '';
            const matchesSearch = title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                desc.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesStatus = statusFilter === 'all' || e.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [allEvents, searchQuery, statusFilter]);

    const handleDelete = (id: string) => {
        if (firestore && confirm('Are you sure you want to delete this event?')) {
            deleteEvent(firestore, id);
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
                <div className="bg-primary text-white p-6 mb-6 border-b border-primary/10 rounded-tl-3xl rounded-br-3xl shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-accent/20 rounded-full blur-3xl opacity-20" />

                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                        <div>
                            <h1 className="text-3xl sm:text-4xl font-bold mb-2 tracking-tight">Events Management</h1>
                            <p className="text-white/80 text-lg font-medium">Manage all events, tickets, and attendees</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <Button className="bg-secondary hover:bg-secondary/90 text-white border-none h-12 px-6 rounded-tl-xl rounded-br-xl font-bold shadow-lg transition-all" asChild>
                                <Link href="/a/events/new">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Create Event
                                </Link>
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Filters Row */}
                <div className="flex flex-col lg:flex-row gap-4 mb-6 items-end">
                    <div className="relative flex-1 group w-full">
                        <label className="text-xs font-bold text-primary/40 uppercase tracking-widest ml-1 mb-2 block">Search Events</label>
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary/30 group-focus-within:text-primary transition-colors" />
                            <Input
                                placeholder="Search by event title..."
                                className="pl-12 h-14 bg-white border-primary/10 rounded-tl-xl rounded-br-xl focus:ring-primary shadow-sm text-base font-medium"
                                value={searchQuery}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-4 items-end w-full lg:w-auto">
                        <DropdownCard
                            label="Lifecycle Status"
                            value={statusFilter}
                            onChange={(val: string) => setStatusFilter(val)}
                            options={[
                                { value: 'all', label: 'All Stages' },
                                { value: 'draft', label: 'Draft' },
                                { value: 'published', label: 'Published' },
                                { value: 'completed', label: 'Completed' },
                                { value: 'cancelled', label: 'Cancelled' }
                            ]}
                            className="w-full sm:w-64"
                        />
                    </div>
                </div>

                {/* Events Table */}
                <div className="w-full bg-white shadow-lg border border-primary/10 overflow-hidden rounded-tl-2xl rounded-br-2xl">
                    <div className="overflow-x-auto">
                        <Table className="w-full">
                            <TableHeader className="bg-primary/5 border-b border-primary/10">
                                <TableRow className="hover:bg-transparent">
                                    <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest w-12 text-center text-nowrap">ID</TableHead>
                                    <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest">Event Display</TableHead>
                                    <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest text-center">Type</TableHead>
                                    <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest text-center">Status</TableHead>
                                    <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest text-center">Tickets</TableHead>
                                    <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody className="divide-y divide-primary/10">
                                {filteredEvents.map((event) => {
                                    const totalTickets = event.ticketTypes?.reduce((acc, t) => acc + (Number(t.capacity) || 0), 0) || 0;
                                    const startingPrice = event.ticketTypes?.length > 0 ? Math.min(...event.ticketTypes.map(t => Number(t.price) || 0)) : 0;
                                    return (
                                        <TableRow key={event.id} className="hover:bg-primary/5 cursor-pointer transition-colors group border-primary/10">
                                            <TableCell className="px-6 py-4 font-black text-primary/30 text-xs text-center">
                                                <span className="truncate w-10 block">#{event.id.substring(0, 5)}</span>
                                            </TableCell>
                                            <TableCell className="px-6 py-4">
                                                <div className="flex items-center gap-4">
                                                    {event.imageUrl ? (
                                                        <div className="h-12 w-16 bg-primary/10 rounded-md overflow-hidden flex-shrink-0">
                                                            <img src={event.imageUrl} alt={event.title} className="h-full w-full object-cover" />
                                                        </div>
                                                    ) : (
                                                        <div className="h-12 w-16 bg-primary/10 rounded-md flex-shrink-0 flex items-center justify-center">
                                                            <Calendar className="h-5 w-5 text-primary/30" />
                                                        </div>
                                                    )}
                                                    <div className="max-w-[300px]">
                                                        <p className="font-bold text-primary leading-tight truncate" title={event.title}>{event.title}</p>
                                                        <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] font-bold text-primary/40 mt-1 uppercase tracking-widest">
                                                            {event.date && (
                                                                <span className="flex items-center gap-1">
                                                                    <Calendar className="h-3 w-3" />
                                                                    {format(event.date.toDate(), 'MMM d, yyyy')}
                                                                </span>
                                                            )}
                                                            <span className="flex items-center gap-1 truncate w-32" title={event.location}>
                                                                <MapPin className="h-3 w-3" />
                                                                {event.location}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="px-6 py-4 text-center">
                                                <Badge variant="outline" className="font-bold text-[9px] uppercase tracking-widest bg-white border-primary/20 text-primary">
                                                    {event.eventType || 'Event'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="px-6 py-4 text-center">
                                                <Badge className={cn(
                                                    "rounded-sm font-bold text-[9px] uppercase tracking-widest border-none px-3",
                                                    event.status === 'published' ? 'bg-green-500 text-white' :
                                                        event.status === 'completed' ? 'bg-primary/20 text-primary/60' :
                                                            event.status === 'draft' ? 'bg-blue-500 text-white' : 'bg-red-500 text-white'
                                                )}>
                                                    {event.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="px-6 py-4 text-center">
                                                <div className="flex flex-col items-center">
                                                    <span className="text-xs font-bold text-primary flex items-center gap-1">
                                                        <Tag className="h-3 w-3 text-accent" />
                                                        {event.ticketTypes?.length || 0} Tiers
                                                    </span>
                                                    <span className="text-[10px] text-primary/40 uppercase font-black tracking-widest">
                                                        {totalTickets} Max Cap
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button variant="ghost" size="sm" asChild className="h-8 hover:bg-green-500 hover:text-white rounded-md">
                                                        <Link href={`/a/events/${event.id}`}>
                                                            <Eye className="h-4 w-4" />
                                                        </Link>
                                                    </Button>
                                                    <Button variant="ghost" size="sm" asChild className="h-8 hover:bg-primary/5 rounded-md">
                                                        <Link href={`/a/events/${event.id}`}>
                                                            <Edit className="h-4 w-4 text-primary" />
                                                        </Link>
                                                    </Button>
                                                    <Button variant="ghost" size="sm" className="h-8 hover:bg-accent/10 hover:text-accent rounded-md" onClick={(e) => { e.stopPropagation(); handleDelete(event.id); }}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                                {filteredEvents.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-20 text-primary/40 font-bold uppercase tracking-widest">
                                            No events found matching your criteria
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
                    className="w-full appearance-none bg-white border border-primary/10 rounded-xl px-4 py-2 text-sm font-bold text-primary focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all cursor-pointer h-14"
                >
                    {options.map((opt: any) => (
                        <option key={opt.value} value={opt.value} className="font-medium">{opt.label}</option>
                    ))}
                </select>
            </div>
        </div>
    );
}
