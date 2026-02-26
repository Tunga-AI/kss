'use client';
import { useMemo } from 'react';
import { useParams, notFound, useRouter, useSearchParams } from 'next/navigation';
import { useFirestore, useDoc, useUser, useCollection } from '@/firebase';
import { doc, updateDoc, collection, Timestamp, arrayUnion, query, where } from 'firebase/firestore';
import type { SaleLead } from '@/lib/sales-types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, User, Mail, Calendar, BarChart, CheckCircle2, AlertCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from "@/lib/utils";
import { useState } from 'react';
import type { Staff } from '@/lib/staff-types';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { format } from "date-fns";
import { Plus, UserPlus, StickyNote, Send } from "lucide-react";

export default function LeadDetailPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();
    const id = Array.isArray(params.id) ? params.id[0] : params.id;
    const leadNo = searchParams.get('leadNo');
    const firestore = useFirestore(); // kenyasales DB
    const { user } = useUser();
    const [noteContent, setNoteContent] = useState('');
    const [isAddingNote, setIsAddingNote] = useState(false);

    const leadRef = useMemo(() => {
        if (!firestore || !id) return null;
        return doc(firestore, 'customers', id);
    }, [firestore, id]);

    const staffQuery = useMemo(() => {
        if (!firestore) return null;
        // Fetch all active staff or filter by role if needed (e.g. role == 'Sales')
        return query(collection(firestore, 'staff'), where('status', '==', 'Active'));
    }, [firestore]);

    const { data: staffMembers } = useCollection<Staff>(staffQuery as any);

    const { data: lead, loading } = useDoc<SaleLead>(leadRef as any);

    const handleStatusChange = async (newStatus: SaleLead['status']) => {
        if (leadRef) {
            await updateDoc(leadRef, { status: newStatus });
        }
    };

    const handleAssignStaff = async (staffId: string) => {
        if (leadRef) {
            await updateDoc(leadRef, { assignedTo: staffId });
        }
    };

    const handleAddNote = async () => {
        if (!leadRef || !noteContent.trim() || !user) return;

        setIsAddingNote(true);
        try {
            const newNote = {
                id: crypto.randomUUID(),
                content: noteContent,
                createdAt: Timestamp.now(),
                authorId: user.uid,
                authorName: user.displayName || 'Staff Member'
            };

            await updateDoc(leadRef, {
                notes: arrayUnion(newNote)
            });

            setNoteContent('');
        } catch (error) {
            console.error("Error adding note:", error);
        } finally {
            setIsAddingNote(false);
        }
    };

    if (loading) {
        return (
            <div className="w-full min-h-screen bg-gray-50/50 p-2 md:p-4 font-body">
                <div className="w-full max-w-7xl mx-auto space-y-6">
                    <Skeleton className="h-48 w-full rounded-3xl" />
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <Skeleton className="h-64 w-full lg:col-span-2 rounded-2xl" />
                        <Skeleton className="h-48 w-full rounded-2xl" />
                    </div>
                </div>
            </div>
        );
    }

    if (!lead) {
        notFound();
    }

    return (
        <div className="w-full min-h-screen bg-gray-50/50 p-2 md:p-4 font-body">
            <div className="w-full">
                {/* Hero Section */}
                <div className="bg-primary text-white p-6 mb-6 border-b border-primary/10 rounded-tl-3xl rounded-br-3xl rounded-tr-none rounded-bl-none shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-accent/20 rounded-full blur-3xl opacity-20" />

                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div className="flex items-center gap-4">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => router.back()}
                                className="text-white/70 hover:text-white hover:bg-white/10 rounded-full h-10 w-10 shrink-0"
                            >
                                <ArrowLeft className="h-6 w-6" />
                            </Button>
                            <div>
                                <div className="flex items-center gap-3 mb-1">
                                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{lead.firstName} {lead.lastName}</h1>
                                    <Badge variant="outline" className="text-white/60 border-white/20 font-mono text-xs hidden sm:inline-flex">#{leadNo || lead.id}</Badge>
                                </div>
                                <div className="flex flex-wrap items-center gap-4 text-white/70 text-sm font-medium">
                                    <div className="flex items-center gap-1.5">
                                        <Mail className="h-3.5 w-3.5" />
                                        {lead.email}
                                    </div>
                                    {lead.createdAt && (
                                        <div className="flex items-center gap-1.5">
                                            <Calendar className="h-3.5 w-3.5" />
                                            Admitted: {lead.createdAt.toDate().toLocaleDateString()}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                            <div className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none font-bold text-sm shadow-lg border backdrop-blur-sm",
                                lead.status?.toLowerCase() === 'admitted' ? 'bg-green-500/20 text-green-100 border-green-500/30' :
                                    lead.status?.toLowerCase() === 'lost' ? 'bg-red-500/20 text-red-100 border-red-500/30' :
                                        'bg-white/10 text-white border-white/10'
                            )}>
                                {lead.status?.toLowerCase() === 'admitted' ? <CheckCircle2 className="h-4 w-4" /> :
                                    lead.status?.toLowerCase() === 'lost' ? <AlertCircle className="h-4 w-4" /> :
                                        <BarChart className="h-4 w-4" />}
                                <span className="uppercase tracking-wide">{lead.status}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Details */}
                    <Card className="lg:col-span-2 border-primary/10 shadow-lg rounded-tl-2xl rounded-br-2xl rounded-tr-none rounded-bl-none overflow-hidden bg-white">
                        <CardHeader className="bg-primary/5 border-b border-primary/10 pb-4">
                            <CardTitle className="text-primary font-bold text-lg uppercase tracking-wider flex items-center gap-2">
                                <User className="h-5 w-5 text-primary/60" />
                                Lead Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 grid gap-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-1.5">
                                    <Label className="text-xs uppercase tracking-widest text-primary/40 font-bold">Full Name</Label>
                                    <div className="p-3 bg-gray-50 border border-primary/5 rounded-tl-lg rounded-br-lg rounded-tr-none rounded-bl-none font-medium text-primary">
                                        {lead.firstName} {lead.lastName}
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs uppercase tracking-widest text-primary/40 font-bold">Email Address</Label>
                                    <div className="p-3 bg-gray-50 border border-primary/5 rounded-tl-lg rounded-br-lg rounded-tr-none rounded-bl-none font-medium text-primary flex items-center gap-2 break-all">
                                        <Mail className="h-4 w-4 text-primary/30 shrink-0" />
                                        {lead.email}
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs uppercase tracking-widest text-primary/40 font-bold">Organization</Label>
                                    <div className="p-3 bg-gray-50 border border-primary/5 rounded-tl-lg rounded-br-lg rounded-tr-none rounded-bl-none font-medium text-primary">
                                        {lead.currentOrganization || 'N/A'}
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs uppercase tracking-widest text-primary/40 font-bold">Current Role</Label>
                                    <div className="p-3 bg-gray-50 border border-primary/5 rounded-tl-lg rounded-br-lg rounded-tr-none rounded-bl-none font-medium text-primary">
                                        {lead.currentRole || 'N/A'}
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs uppercase tracking-widest text-primary/40 font-bold">Interested Program</Label>
                                    <div className="p-3 bg-gray-50 border border-primary/5 rounded-tl-lg rounded-br-lg rounded-tr-none rounded-bl-none font-medium text-primary">
                                        {lead.programName || 'Not specified'}
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs uppercase tracking-widest text-primary/40 font-bold">Current Stage</Label>
                                    <div className="p-3 bg-gray-50 border border-primary/5 rounded-tl-lg rounded-br-lg rounded-tr-none rounded-bl-none font-medium text-primary flex items-center gap-2">
                                        <div className={cn("h-2 w-2 rounded-full",
                                            lead.status?.toLowerCase() === 'admitted' ? 'bg-green-500' :
                                                lead.status?.toLowerCase() === 'lost' ? 'bg-red-500' : 'bg-blue-500'
                                        )} />
                                        {lead.status}
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs uppercase tracking-widest text-primary/40 font-bold">Social Media</Label>
                                    <div className="p-3 bg-gray-50 border border-primary/5 rounded-tl-lg rounded-br-lg rounded-tr-none rounded-bl-none font-medium text-primary">
                                        {lead.socialMediaPlatform || 'N/A'}
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs uppercase tracking-widest text-primary/40 font-bold">Communication Pref</Label>
                                    <div className="p-3 bg-gray-50 border border-primary/5 rounded-tl-lg rounded-br-lg rounded-tr-none rounded-bl-none font-medium text-primary capitalize">
                                        {lead.communicationPreference || 'Any'}
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs uppercase tracking-widest text-primary/40 font-bold">Staff/Student Name</Label>
                                    <div className="p-3 bg-gray-50 border border-primary/5 rounded-tl-lg rounded-br-lg rounded-tr-none rounded-bl-none font-medium text-primary">
                                        {lead.staffStudentName || 'N/A'}
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs uppercase tracking-widest text-primary/40 font-bold">WhatsApp</Label>
                                    <div className="p-3 bg-gray-50 border border-primary/5 rounded-tl-lg rounded-br-lg rounded-tr-none rounded-bl-none font-medium text-primary">
                                        {lead.whatsappNumber || 'N/A'}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Notes Section */}
                    <Card className="lg:col-span-2 border-primary/10 shadow-lg rounded-tl-2xl rounded-br-2xl rounded-tr-none rounded-bl-none overflow-hidden bg-white">
                        <CardHeader className="bg-primary/5 border-b border-primary/10 pb-4">
                            <CardTitle className="text-primary font-bold text-lg uppercase tracking-wider flex items-center gap-2">
                                <StickyNote className="h-5 w-5 text-primary/60" />
                                Notes & Activity
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 grid gap-6">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-xs uppercase tracking-widest text-primary/40 font-bold">Add Note</Label>
                                    <div className="flex gap-2">
                                        <Textarea
                                            placeholder="Type your note here..."
                                            value={noteContent}
                                            onChange={(e) => setNoteContent(e.target.value)}
                                            className="min-h-[80px] bg-gray-50 border-primary/10 focus:border-primary rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none resize-none"
                                        />
                                    </div>
                                    <div className="flex justify-end">
                                        <Button
                                            size="sm"
                                            onClick={handleAddNote}
                                            disabled={!noteContent.trim() || isAddingNote}
                                            className="bg-primary text-white rounded-tl-lg rounded-br-lg rounded-tr-none rounded-bl-none"
                                        >
                                            <Send className="h-3.5 w-3.5 mr-2" />
                                            Add Note
                                        </Button>
                                    </div>
                                </div>

                                <div className="border-t border-primary/5 pt-4">
                                    <Label className="text-xs uppercase tracking-widest text-primary/40 font-bold mb-4 block">History</Label>
                                    <ScrollArea className="h-[300px] pr-4">
                                        <div className="space-y-4">
                                            {lead.notes && lead.notes.length > 0 ? (
                                                [...lead.notes].sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis()).map((note) => (
                                                    <div key={note.id} className="bg-gray-50 border border-primary/5 p-4 rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none">
                                                        <div className="flex justify-between items-start mb-2">
                                                            <div className="flex items-center gap-2">
                                                                <Avatar className="h-6 w-6">
                                                                    <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                                                                        {note.authorName?.charAt(0) || 'U'}
                                                                    </AvatarFallback>
                                                                </Avatar>
                                                                <span className="text-xs font-bold text-primary">{note.authorName}</span>
                                                            </div>
                                                            <span className="text-[10px] text-primary/40 font-medium">
                                                                {note.createdAt ? format(note.createdAt.toDate(), 'MMM d, yyyy h:mm a') : 'Just now'}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm text-primary/80 whitespace-pre-wrap leading-relaxed pl-8">
                                                            {note.content}
                                                        </p>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="text-center py-10 text-primary/30 text-sm italic">
                                                    No notes added yet.
                                                </div>
                                            )}
                                        </div>
                                    </ScrollArea>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Sidebar / Status Management */}
                    <Card className="border-primary/10 shadow-lg rounded-tl-2xl rounded-br-2xl rounded-tr-none rounded-bl-none overflow-hidden h-fit bg-white">
                        <CardHeader className="bg-primary/5 border-b border-primary/10 pb-4">
                            <CardTitle className="text-primary font-bold text-lg uppercase tracking-wider flex items-center gap-2">
                                <BarChart className="h-5 w-5 text-primary/60" />
                                Actions
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            <div className="space-y-2">
                                <Label className="text-xs uppercase tracking-widest text-primary/40 font-bold flex items-center gap-2">
                                    <UserPlus className="h-3.5 w-3.5" />
                                    Assigned Staff
                                </Label>
                                <Select
                                    value={lead.assignedTo || "unassigned"}
                                    onValueChange={(val) => handleAssignStaff(val === "unassigned" ? "" : val)}
                                >
                                    <SelectTrigger className="w-full bg-white border-primary/10 font-bold text-primary h-12 rounded-tl-lg rounded-br-lg rounded-tr-none rounded-bl-none focus:ring-primary/20">
                                        <SelectValue placeholder="Select staff member" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="unassigned" className="text-primary/50 italic">Unassigned</SelectItem>
                                        {staffMembers?.map((staff) => (
                                            <SelectItem key={staff.id} value={staff.id} className="font-medium">
                                                {staff.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs uppercase tracking-widest text-primary/40 font-bold block">Update Status</Label>
                                <Select value={lead.status} onValueChange={handleStatusChange}>
                                    <SelectTrigger className="w-full bg-white border-primary/10 font-bold text-primary h-12 rounded-tl-lg rounded-br-lg rounded-tr-none rounded-bl-none focus:ring-primary/20">
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Prospect" className="font-medium">Prospect</SelectItem>
                                        <SelectItem value="Lead" className="font-medium">Lead</SelectItem>
                                        <SelectItem value="Admitted" className="font-medium text-green-600">Admitted</SelectItem>
                                        <SelectItem value="Lost" className="font-medium text-red-600">Lost</SelectItem>
                                    </SelectContent>
                                </Select>
                                <p className="text-[10px] text-primary/40 leading-relaxed mt-1">
                                    Changing status updates the lead's position in the sales funnel immediately.
                                </p>
                            </div>

                            <div className="pt-4 border-t border-primary/5">
                                <Button className="w-full bg-primary text-white h-12 rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none font-bold shadow-md hover:bg-primary/90 transition-all">
                                    <Mail className="h-4 w-4 mr-2" />
                                    Send Email
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
