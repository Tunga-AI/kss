'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, Plus, RefreshCw, Search, ChevronDown, Users, Calendar, Edit, Trash2, Mail, Layers, Briefcase } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useUsersFirestore, useCollection, useUser } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import type { Cohort } from '@/lib/cohort-types';
import type { Program } from '@/lib/program-types';
import { deleteCohort } from '@/lib/cohorts';
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

export default function CohortsPage() {
  const firestore = useUsersFirestore();
  const { user } = useUser();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const cohortsQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'cohorts'));
  }, [firestore]);

  const { data: allCohorts, loading } = useCollection<Cohort>(cohortsQuery as any);

  // Fetch programs for display
  const programsQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'programs'));
  }, [firestore]);

  const { data: programs } = useCollection<Program>(programsQuery as any);

  const filteredCohorts = useMemo(() => {
    if (!allCohorts || !user) return [];

    // Show all cohorts to Admins and Facilitators
    // Filter based on search and status only
    return allCohorts
      .filter(c => {
        const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        const getStatusWeight = (status: string) => {
          if (status === 'Accepting Applications') return 1;
          if (status === 'Closed') return 3;
          return 2; // 'In Review' or anything else
        };

        const weightDiff = getStatusWeight(a.status) - getStatusWeight(b.status);
        if (weightDiff !== 0) return weightDiff;

        // Sort by name descending to get the "latest number" first
        // This handles cases like "Cohort 10" vs "Cohort 9" by using localeCompare with numeric: true
        return b.name.localeCompare(a.name, undefined, { numeric: true, sensitivity: 'base' });
      });
  }, [allCohorts, user, searchQuery, statusFilter]);

  const handleDelete = (id: string) => {
    if (firestore && confirm('Are you sure you want to delete this cohort?')) {
      deleteCohort(firestore, id);
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
        {/* Cohorts Hero Section */}
        <div className="bg-primary text-white p-6 mb-6 border-b border-primary/10 rounded-tl-3xl rounded-br-3xl rounded-tr-none rounded-bl-none shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-accent/20 rounded-full blur-3xl opacity-20" />

          <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Layers className="h-8 w-8 bg-accent/20 p-1.5 rounded-lg text-accent" />
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Cohort Management</h1>
              </div>
              <p className="text-white/80 text-lg font-medium">Coordinate program intakes and manage admissions councils</p>
            </div>
            <div className="flex items-center gap-3">

              <Button className="bg-secondary hover:bg-secondary/90 text-white border-none h-12 px-6 rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none font-bold shadow-lg transition-all" asChild>
                <Link href="/a/cohorts/new">
                  <Plus className="h-4 w-4 mr-2" />
                  New Cohort
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Filters Row */}
        <div className="flex flex-col lg:flex-row gap-4 mb-6 items-end">
          <div className="relative flex-1 group w-full">
            <label className="text-xs font-bold text-primary/40 uppercase tracking-widest ml-1 mb-2 block">Search Intake</label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary/30 group-focus-within:text-primary transition-colors" />
              <Input
                placeholder="Search by cohort name..."
                className="pl-12 h-14 bg-white border-primary/10 rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none focus:ring-primary focus:border-primary shadow-sm text-base font-medium"
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
                { value: 'Accepting Applications', label: 'Accepting Applications' },
                { value: 'In Review', label: 'In Review' },
                { value: 'Closed', label: 'Closed' }
              ]}
              className="w-full sm:w-64"
            />
          </div>
        </div>

        {/* Cohorts Table */}
        <div className="w-full bg-white shadow-lg border border-primary/10 overflow-hidden rounded-tl-2xl rounded-br-2xl rounded-tr-none rounded-bl-none">
          <div className="overflow-x-auto">
            <Table className="w-full">
              <TableHeader className="bg-primary/5 border-b border-primary/10">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest w-12">ID</TableHead>
                  <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest">Intake Name</TableHead>
                  <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest text-center">Programs</TableHead>
                  <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest text-center">Lifecycle Stage</TableHead>
                  <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest text-center">Council Size</TableHead>
                  <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-primary/10">
                {filteredCohorts.map((cohort) => (
                  <TableRow key={cohort.id} className="hover:bg-primary/5 cursor-pointer transition-colors group border-primary/10">
                    <TableCell className="px-6 py-4 font-black text-primary/30 text-xs">
                      #{cohort.id}
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 flex items-center justify-center rounded-tl-lg rounded-br-lg bg-primary/10 text-primary/40 group-hover:bg-accent group-hover:text-white transition-all">
                          <Users className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-bold text-primary leading-tight">{cohort.name}</p>
                          <p className="text-[10px] text-primary/40 uppercase font-black mt-1">Academic Intake</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4 text-center">
                      <div className="flex flex-col items-center">
                        <span className="font-bold text-primary">
                          {(cohort.programIds?.length || (cohort.programId ? 1 : 0))}
                        </span>
                        <span className="text-[9px] uppercase font-black text-primary/30">Programs</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4 text-center">
                      <Badge className={cn(
                        "rounded-tl-sm rounded-br-sm rounded-tr-none rounded-bl-none font-bold text-[9px] uppercase tracking-widest border-none px-3",
                        cohort.status === 'Accepting Applications' ? 'bg-green-500 text-white' :
                          cohort.status === 'Closed' ? 'bg-primary/20 text-primary/60' :
                            'bg-accent text-white'
                      )}>
                        {cohort.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-6 py-4 text-center">
                      <div className="flex flex-col items-center">
                        <span className="font-bold text-primary">{cohort.council?.length || 0}</span>
                        <span className="text-[9px] uppercase font-black text-primary/30">Members</span>
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
                          <Link href={`/a/cohorts/${cohort.id}`}>
                            <Edit className="h-4 w-4 text-primary" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 shadow-none hover:bg-accent/10 hover:text-accent rounded-tl-md rounded-br-md rounded-tr-none rounded-bl-none"
                          onClick={(e) => { e.stopPropagation(); handleDelete(cohort.id); }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredCohorts.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-20 text-primary/40 font-bold uppercase tracking-widest">
                      No cohorts found matching filters
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
