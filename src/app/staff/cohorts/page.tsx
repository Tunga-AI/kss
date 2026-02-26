'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Search, ChevronDown, Users, Layers, Briefcase, CheckCircle2, XCircle, ArrowRight } from "lucide-react";
import { useUsersFirestore, useCollection, useUser } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import type { Cohort } from '@/lib/cohort-types';
import type { Program } from '@/lib/program-types';
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

export default function StaffCohortsPage() {
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

    return allCohorts
      .filter(c => {
        const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        return b.name.localeCompare(a.name, undefined, { numeric: true, sensitivity: 'base' });
      });
  }, [allCohorts, user, searchQuery, statusFilter]);

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
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Cohorts / Intakes</h1>
              </div>
              <p className="text-white/80 text-lg font-medium">View all program intakes and check your admissions committee status</p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                className="border-white text-white hover:bg-white hover:text-primary h-12 px-6 rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none font-bold transition-all"
                onClick={() => window.location.reload()}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
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
                  <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest">Programs</TableHead>
                  <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest text-center">Lifecycle Stage</TableHead>
                  <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest text-center">Admissions Committee?</TableHead>
                  <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-primary/10">
                {filteredCohorts.map((cohort) => {
                  const isCouncilMember = user?.id ? cohort.council?.includes(user.id) : false;

                  return (
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
                      <TableCell className="px-6 py-4">
                        <div className="flex flex-wrap gap-1.5">
                          {(cohort.programIds || (cohort.programId ? [cohort.programId] : [])).map((programId) => {
                            const program = programs?.find(p => p.id === programId);
                            return program ? (
                              <Badge
                                key={programId}
                                variant="outline"
                                className="text-[9px] bg-blue-50 text-blue-700 border-blue-200 rounded-sm px-2 py-0.5"
                              >
                                <Briefcase className="h-3 w-3 mr-1" />
                                {program.title}
                              </Badge>
                            ) : null;
                          })}
                          {!(cohort.programIds?.length || cohort.programId) && (
                            <span className="text-xs text-primary/40 italic">No programs assigned</span>
                          )}
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
                        {isCouncilMember ? (
                          <div className="flex flex-col items-center justify-center gap-1 text-green-600">
                            <CheckCircle2 className="h-5 w-5" />
                            <span className="text-[9px] uppercase font-black">Yes</span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center gap-1 text-gray-400">
                            <XCircle className="h-5 w-5" />
                            <span className="text-[9px] uppercase font-black">No</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="px-6 py-4 text-right">
                        {isCouncilMember && (
                          <div className="flex justify-end gap-2 transition-opacity">
                            <Button
                              variant="ghost"
                              size="sm"
                              asChild
                              className="h-8 shadow-none text-accent hover:bg-accent/10 rounded-tl-md rounded-br-md rounded-tr-none rounded-bl-none"
                            >
                              <Link href={`/f/admissions`}>
                                View <ArrowRight className="h-4 w-4 ml-1" />
                              </Link>
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
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
