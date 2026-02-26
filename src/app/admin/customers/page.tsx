'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, Plus, RefreshCw, Search, ChevronDown, User as UserIcon, BarChart, Mail, ArrowRight, Edit, Trash2, Eye, Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, where, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import type { SaleLead } from '@/lib/sales-types';
import type { Staff } from '@/lib/staff-types';
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear, subWeeks, isWithinInterval } from 'date-fns';
import type { Program } from '@/lib/program-types';
import { DateRange } from "react-day-picker";

export default function CustomersPage() {
  const firestore = useFirestore(); // kenyasales DB — customers, leads, programs, staff

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [programFilter, setProgramFilter] = useState('all');
  const [programTypeFilter, setProgramTypeFilter] = useState('all');
  const [dateRangeFilter, setDateRangeFilter] = useState('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [editingLead, setEditingLead] = useState<SaleLead | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const programsQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'programs'));
  }, [firestore]);

  const { data: programs } = useCollection<Program>(programsQuery as any);

  const staffQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'staff'), where('status', '==', 'Active'));
  }, [firestore]);

  const { data: staffMembers } = useCollection<Staff>(staffQuery as any);

  const staffMap = useMemo(() => {
    if (!staffMembers) return {};
    return staffMembers.reduce((acc: any, staff: Staff) => {
      acc[staff.id] = staff.name;
      return acc;
    }, {});
  }, [staffMembers]);

  const handleEditClick = (lead: SaleLead) => {
    setEditingLead(lead);
    setIsEditOpen(true);
  };

  const handleUpdateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore || !editingLead) return;

    setIsUpdating(true);
    try {
      const leadRef = doc(firestore, 'customers', editingLead.id);
      await updateDoc(leadRef, {
        firstName: editingLead.firstName,
        lastName: editingLead.lastName,
        email: editingLead.email,
        whatsappNumber: editingLead.whatsappNumber,
        programName: editingLead.programName,
        programType: editingLead.programType,
        status: editingLead.status,
        // Update other fields as needed
        currentOrganization: editingLead.currentOrganization,
        currentRole: editingLead.currentRole,
        priority: editingLead.priority
      });
      setIsEditOpen(false);
      setEditingLead(null);
    } catch (error) {
      console.error("Error updating lead:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async (leadId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!firestore || !confirm('Are you sure you want to delete this lead? This action cannot be undone.')) return;

    try {
      await deleteDoc(doc(firestore, 'customers', leadId));
    } catch (error) {
      console.error("Error deleting lead:", error);
      alert("Failed to delete lead. Please try again.");
    }
  };

  const salesQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'customers'));
  }, [firestore]);

  const { data: allLeads, loading } = useCollection<SaleLead>(salesQuery as any);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // 1. Assign dynamic IDs based on global history (Oldest = L1)
  const leadsWithIds = useMemo(() => {
    if (!allLeads) return [];
    // Sort by createdAt ASC (Oldest first) to assign IDs
    const sortedByDate = [...allLeads].sort((a, b) => {
      const dateA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt ? new Date(a.createdAt as any).getTime() : 0);
      const dateB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt ? new Date(b.createdAt as any).getTime() : 0);
      return dateA - dateB;
    });

    return sortedByDate.map((lead, index) => ({
      ...lead,
      displayId: `L${index + 1}`
    }));
  }, [allLeads]);

  const filteredLeads = useMemo(() => {
    return leadsWithIds.filter(l => {
      const fullName = `${l.firstName || ''} ${l.lastName || ''}`.trim();
      const matchesSearch = fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (l.programName && l.programName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        l.displayId.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || l.status?.toLowerCase() === statusFilter.toLowerCase();
      const matchesProgram = programFilter === 'all' || l.programName === programFilter;
      const matchesProgramType = programTypeFilter === 'all' || l.programType === programTypeFilter;

      let matchesDate = true;
      if (dateRangeFilter !== 'all') {
        const leadDate = l.createdAt?.toDate ? l.createdAt.toDate() : (l.createdAt ? new Date(l.createdAt as any) : null);
        if (!leadDate) {
          matchesDate = false;
        } else {
          const now = new Date();
          let start: Date;
          let end: Date;

          switch (dateRangeFilter) {
            case 'last-week':
              start = startOfWeek(subWeeks(now, 1));
              end = endOfWeek(subWeeks(now, 1));
              break;
            case 'this-week':
              start = startOfWeek(now);
              end = endOfWeek(now);
              break;
            case 'this-month':
              start = startOfMonth(now);
              end = endOfMonth(now);
              break;
            case 'this-quarter':
              start = startOfQuarter(now);
              end = endOfQuarter(now);
              break;
            case 'this-year':
              start = startOfYear(now);
              end = endOfYear(now);
              break;
            case 'custom':
              if (dateRange?.from && dateRange?.to) {
                start = dateRange.from;
                end = dateRange.to;
              } else {
                return true; // Don't filter if custom is selected but range is not set
              }
              break;
            default:
              return true;
          }
          matchesDate = isWithinInterval(leadDate, { start, end });
        }
      }

      return matchesSearch && matchesStatus && matchesProgram && matchesProgramType && matchesDate;
    }).sort((a, b) => {
      // Sort by Newest first (which corresponds to highest displayId)
      const dateA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt ? new Date(a.createdAt as any).getTime() : 0);
      const dateB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt ? new Date(b.createdAt as any).getTime() : 0);
      return dateB - dateA;
    });
  }, [leadsWithIds, searchQuery, statusFilter, programFilter, programTypeFilter, dateRangeFilter, dateRange]);

  const totalPages = Math.ceil(filteredLeads.length / itemsPerPage);
  const paginatedLeads = filteredLeads.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
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
        {/* CRM Hero Section */}
        <div className="bg-primary text-white p-6 mb-6 border-b border-primary/10 rounded-tl-3xl rounded-br-3xl rounded-tr-none rounded-bl-none shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-accent/20 rounded-full blur-3xl opacity-20" />

          <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <BarChart className="h-8 w-8 bg-accent/20 p-1.5 rounded-lg" />
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Customer Management</h1>
              </div>
              <p className="text-white/80 text-lg font-medium">Manage leads and conversions across the sales funnel</p>
            </div>
            <div className="flex items-center gap-3">

              <Button className="bg-secondary text-white border-none h-12 px-6 rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none font-bold shadow-lg transition-all">
                <Plus className="h-4 w-4 mr-2" />
                Add Lead
              </Button>
            </div>
          </div>
        </div>

        {/* Filters Row */}
        <div className="flex flex-col lg:flex-row gap-4 mb-6 items-end">
          <div className="relative flex-1 group w-full">
            <label className="text-xs font-bold text-primary/40 uppercase tracking-widest ml-1 mb-2 block">Search Leads</label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary/30 group-focus-within:text-primary transition-colors" />
              <Input
                placeholder="Search by lead name, email or program..."
                className="pl-12 h-14 bg-white border-primary/10 rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none focus:ring-primary focus:border-primary shadow-sm text-base font-medium"
                value={searchQuery}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-4 items-end w-full lg:w-auto">
            <DropdownCard
              label="Status"
              value={statusFilter}
              onChange={(val: string) => setStatusFilter(val)}
              options={[
                { value: 'all', label: 'All Status' },
                { value: 'New', label: 'New Lead' },
                { value: 'Contacted', label: 'Contacted' },
                { value: 'Admitted', label: 'Admitted' },
                { value: 'Lost', label: 'Lost' }
              ]}
              className="w-full sm:w-32"
            />
            <DropdownCard
              label="Type"
              value={programTypeFilter}
              onChange={(val: string) => setProgramTypeFilter(val)}
              options={[
                { value: 'all', label: 'All Types' },
                { value: 'Core', label: 'Core' },
                { value: 'Short', label: 'Short' },
                { value: 'E-Learning', label: 'E-Learning' },
                { value: 'Event', label: 'Event' },
                { value: 'B2B', label: 'B2B' },
                { value: 'B2C', label: 'B2C' },
                { value: 'Bootcamp', label: 'Bootcamp' }
              ]}
              className="w-full sm:w-32"
            />
            <DropdownCard
              label="Program"
              value={programFilter}
              onChange={(val: string) => setProgramFilter(val)}
              options={[
                { value: 'all', label: 'All Programs' },
                ...(programs?.map(p => ({ value: p.title, label: p.title })) || [])
              ]}
              className="w-full sm:w-40"
            />
            <DropdownCard
              label="Range"
              value={dateRangeFilter}
              onChange={(val: string) => setDateRangeFilter(val)}
              options={[
                { value: 'all', label: 'All Time' },
                { value: 'this-week', label: 'This Week' },
                { value: 'last-week', label: 'Last Week' },
                { value: 'this-month', label: 'This Month' },
                { value: 'this-quarter', label: 'This Quarter' },
                { value: 'this-year', label: 'This Year' },
                { value: 'custom', label: 'Custom Range' }
              ]}
              className="w-full sm:w-40"
            />
            {dateRangeFilter === 'custom' && (
              <div className="flex flex-col gap-2 w-full sm:w-auto">
                <label className="text-xs font-bold text-primary/40 uppercase tracking-widest ml-1">Custom Range</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full sm:w-[260px] h-14 justify-start text-left font-bold bg-white border border-primary/10 rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none",
                        !dateRange && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange?.from ? (
                        dateRange.to ? (
                          <>
                            {format(dateRange.from, "LLL dd, y")} -{" "}
                            {format(dateRange.to, "LLL dd, y")}
                          </>
                        ) : (
                          format(dateRange.from, "LLL dd, y")
                        )
                      ) : (
                        <span>Pick a date range</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      initialFocus
                      mode="range"
                      defaultMonth={dateRange?.from}
                      selected={dateRange}
                      onSelect={setDateRange}
                      numberOfMonths={2}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}
          </div>
        </div>

        {/* Leads Table */}
        <div className="w-full bg-white shadow-lg border border-primary/10 overflow-hidden rounded-tl-2xl rounded-br-2xl rounded-tr-none rounded-bl-none">
          <div className="overflow-x-auto">
            <Table className="w-full">
              <TableHeader className="bg-primary/5 border-b border-primary/10">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest w-12 text-center text-nowrap">Lead #</TableHead>
                  <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest">Lead Profile</TableHead>
                  <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest text-center">Program</TableHead>
                  <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest text-center">Program Type</TableHead>
                  <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest text-center">Enrollment</TableHead>
                  <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest text-center">Recorded Date</TableHead>
                  <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest text-center">Status</TableHead>
                  <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-primary/10">
                {paginatedLeads.map((lead: any) => (
                  <TableRow key={lead.id} className="hover:bg-primary/5 cursor-pointer transition-colors group border-primary/10">
                    <TableCell className="px-6 py-4 font-black text-primary/30 text-xs text-center">
                      #{lead.displayId}
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 flex items-center justify-center rounded-tl-lg rounded-br-lg rounded-tr-none rounded-bl-none bg-primary/10 border border-primary/5">
                          <UserIcon className="h-5 w-5 text-primary/40" />
                        </div>
                        <div>
                          <p className="font-bold text-primary leading-tight">{lead.firstName} {lead.lastName}</p>
                          <div className="flex items-center gap-1 text-[10px] text-primary/60 mt-0.5">
                            <Mail className="h-3 w-3" />
                            {lead.email}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4 text-center">
                      <span className="text-sm font-bold text-primary/80">{lead.programName || 'N/A'}</span>
                    </TableCell>
                    <TableCell className="px-6 py-4 text-center">
                      <span className="text-xs font-bold text-primary">{lead.programType || '-'}</span>
                    </TableCell>
                    <TableCell className="px-6 py-4 text-center">
                      <span className="text-xs font-medium text-primary/70">{lead.enrollmentType || '-'}</span>
                    </TableCell>
                    <TableCell className="px-6 py-4 text-center">
                      <div className="flex flex-col items-center">
                        <span className="text-xs font-bold text-primary">
                          {lead.createdAt ? format(lead.createdAt.toDate(), 'dd MMM yyyy') : '-'}
                        </span>
                        <span className="text-[10px] text-primary/40 uppercase font-black">
                          {lead.createdAt ? format(lead.createdAt.toDate(), 'HH:mm') : ''}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4 text-center">
                      <span className={cn(
                        "inline-flex text-[9px] font-bold uppercase px-2 py-0.5 rounded-tl-sm rounded-br-sm rounded-tr-none rounded-bl-none",
                        lead.status?.toLowerCase() === 'admitted' ? 'bg-green-500 text-white' :
                          lead.status?.toLowerCase() === 'lost' ? 'bg-accent text-white' :
                            'bg-primary/20 text-primary/60'
                      )}>
                        {lead.status}
                      </span>
                    </TableCell>
                    <TableCell className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                          className="h-8 shadow-none hover:bg-primary/5 rounded-tl-md rounded-br-md rounded-tr-none rounded-bl-none"
                        >
                          <Link href={`/a/customers/${lead.id}?leadNo=${lead.displayId}`}>
                            <Eye className="h-4 w-4 text-primary" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditClick(lead)}
                          className="h-8 shadow-none hover:bg-primary/5 rounded-tl-md rounded-br-md rounded-tr-none rounded-bl-none"
                        >
                          <Edit className="h-4 w-4 text-primary" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 shadow-none hover:bg-accent/10 hover:text-accent rounded-tl-md rounded-br-md rounded-tr-none rounded-bl-none"
                          onClick={(e) => handleDelete(lead.id, e)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {paginatedLeads.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-20 text-primary/40 font-bold uppercase tracking-widest">
                      No leads found in pipeline
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-primary/10 bg-primary/5">
            <div className="text-xs text-primary/50 font-bold uppercase tracking-wider">
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredLeads.length)} of {filteredLeads.length} entries
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="h-8 w-8 rounded-tl-lg rounded-br-lg rounded-tr-none rounded-bl-none border-primary/20 hover:bg-primary hover:text-white transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-1">
                <span className="text-xs font-bold text-primary mx-4">
                  Page {currentPage} of {totalPages || 1}
                </span>
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages || totalPages === 0}
                className="h-8 w-8 rounded-tl-lg rounded-br-lg rounded-tr-none rounded-bl-none border-primary/20 hover:bg-primary hover:text-white transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Lead</DialogTitle>
            <DialogDescription>
              Make changes to the lead details here. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          {editingLead && (
            <form onSubmit={handleUpdateLead}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="firstName" className="text-right">
                    First Name
                  </Label>
                  <Input
                    id="firstName"
                    value={editingLead.firstName}
                    onChange={(e) => setEditingLead({ ...editingLead, firstName: e.target.value })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="lastName" className="text-right">
                    Last Name
                  </Label>
                  <Input
                    id="lastName"
                    value={editingLead.lastName}
                    onChange={(e) => setEditingLead({ ...editingLead, lastName: e.target.value })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="email" className="text-right">
                    Email
                  </Label>
                  <Input
                    id="email"
                    value={editingLead.email}
                    onChange={(e) => setEditingLead({ ...editingLead, email: e.target.value })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="assignedTo" className="text-right">
                    Staff
                  </Label>
                  <Select
                    value={editingLead.assignedTo || "unassigned"}
                    onValueChange={(val) => setEditingLead({ ...editingLead, assignedTo: val === "unassigned" ? undefined : val })}
                  >
                    <SelectTrigger className="col-span-3">
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
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="program" className="text-right">
                    Program
                  </Label>
                  <Input
                    id="program"
                    value={editingLead.programName || ''}
                    onChange={(e) => setEditingLead({ ...editingLead, programName: e.target.value })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="programType" className="text-right">
                    Program Type
                  </Label>
                  <Select
                    value={editingLead.programType || ''}
                    onValueChange={(val: any) => setEditingLead({ ...editingLead, programType: val })}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Core">Core</SelectItem>
                      <SelectItem value="Short">Short</SelectItem>
                      <SelectItem value="E-Learning">E-Learning</SelectItem>
                      <SelectItem value="Event">Event</SelectItem>
                      <SelectItem value="B2B">B2B</SelectItem>
                      <SelectItem value="B2C">B2C</SelectItem>
                      <SelectItem value="Bootcamp">Bootcamp</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="enrollmentType" className="text-right">
                    Enrollment Type
                  </Label>
                  <Select
                    value={editingLead.enrollmentType || ''}
                    onValueChange={(val: any) => setEditingLead({ ...editingLead, enrollmentType: val })}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select enrollment type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Physical">Physical</SelectItem>
                      <SelectItem value="Hybrid">Hybrid</SelectItem>
                      <SelectItem value="Virtual">Virtual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="cohort" className="text-right">
                    Cohort
                  </Label>
                  <Input
                    id="cohort"
                    value={editingLead.cohort || ''}
                    onChange={(e) => setEditingLead({ ...editingLead, cohort: e.target.value })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="status" className="text-right">
                    Status
                  </Label>
                  <Select
                    value={editingLead.status}
                    onValueChange={(val: any) => setEditingLead({ ...editingLead, status: val })}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Prospect">Prospect</SelectItem>
                      <SelectItem value="Lead">Lead</SelectItem>
                      <SelectItem value="Admitted">Admitted</SelectItem>
                      <SelectItem value="Lost">Lost</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isUpdating}>
                  {isUpdating && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
                  Save changes
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div >
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
          {options.map((opt: any, i: number) => (
            <option key={`${opt.value}-${i}`} value={opt.value} className="font-medium">{opt.label}</option>
          ))}
        </select>
        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
          <ChevronDown className="h-4 w-4 text-primary/30 group-hover:text-primary transition-colors" />
        </div>
      </div>
    </div>
  );
}
