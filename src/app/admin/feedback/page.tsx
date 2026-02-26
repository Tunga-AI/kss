'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, RefreshCw, Search, ChevronDown, MessageSquare, Edit, Trash2, BarChart3, Eye } from "lucide-react";
import { useUsersFirestore, useCollection, useUser } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import type { FeedbackCycle } from '@/lib/feedback-types';
import { deleteFeedbackCycle } from '@/lib/feedback';
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

export default function FeedbackManagementPage() {
  const firestore = useUsersFirestore();
  const { user } = useUser();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  const feedbackQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'feedbackCycles'), orderBy('createdAt', 'desc'));
  }, [firestore]);

  const { data: allFeedback, loading } = useCollection<FeedbackCycle>(feedbackQuery as any);

  const filteredFeedback = useMemo(() => {
    if (!allFeedback || !user) return [];

    return allFeedback.filter(f => {
      const matchesSearch = f.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || f.status === statusFilter;
      const matchesType = typeFilter === 'all' || f.type === typeFilter;
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [allFeedback, user, searchQuery, statusFilter, typeFilter]);

  const handleDelete = (id: string) => {
    if (firestore && confirm('Are you sure you want to delete this feedback cycle?')) {
      deleteFeedbackCycle(firestore, id);
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
        {/* Feedback Hero Section */}
        <div className="bg-primary text-white p-6 mb-6 border-b border-primary/10 rounded-tl-3xl rounded-br-3xl rounded-tr-none rounded-bl-none shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-accent/20 rounded-full blur-3xl opacity-20" />

          <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <MessageSquare className="h-8 w-8 bg-accent/20 p-1.5 rounded-lg text-accent" />
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Feedback Management</h1>
              </div>
              <p className="text-white/80 text-lg font-medium">Create and manage feedback cycles across the platform</p>
            </div>
            <div className="flex items-center gap-3">

              <Button className="bg-secondary hover:bg-secondary/90 text-white border-none h-12 px-6 rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none font-bold shadow-lg transition-all" asChild>
                <Link href="/admin/feedback/new">
                  <Plus className="h-4 w-4 mr-2" />
                  New Feedback Cycle
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Filters Row */}
        <div className="flex flex-col lg:flex-row gap-4 mb-6 items-end">
          <div className="relative flex-1 group w-full">
            <label className="text-xs font-bold text-primary/40 uppercase tracking-widest ml-1 mb-2 block">Search Feedback</label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary/30 group-focus-within:text-primary transition-colors" />
              <Input
                placeholder="Search by title or description..."
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
                { value: 'all', label: 'All Statuses' },
                { value: 'draft', label: 'Draft' },
                { value: 'active', label: 'Active' },
                { value: 'closed', label: 'Closed' }
              ]}
              className="w-full sm:w-64"
            />
            <DropdownCard
              label="Type"
              value={typeFilter}
              onChange={(val: string) => setTypeFilter(val)}
              options={[
                { value: 'all', label: 'All Types' },
                { value: 'general', label: 'General' },
                { value: 'class', label: 'Class' },
                { value: 'instructor', label: 'Instructor' },
                { value: 'program', label: 'Program' },
                { value: 'cohort', label: 'Cohort' }
              ]}
              className="w-full sm:w-64"
            />
          </div>
        </div>

        {/* Feedback Table */}
        <div className="w-full bg-white shadow-lg border border-primary/10 overflow-hidden rounded-tl-2xl rounded-br-2xl rounded-tr-none rounded-bl-none">
          <div className="overflow-x-auto">
            <Table className="w-full">
              <TableHeader className="bg-primary/5 border-b border-primary/10">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest">Title</TableHead>
                  <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest text-center">Type</TableHead>
                  <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest text-center">Status</TableHead>
                  <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest text-center">Audience</TableHead>
                  <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest text-center">Questions</TableHead>
                  <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-primary/10">
                {filteredFeedback.map((feedback) => (
                  <TableRow key={feedback.id} className="hover:bg-primary/5 cursor-pointer transition-colors group border-primary/10">
                    <TableCell className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 flex items-center justify-center rounded-tl-lg rounded-br-lg bg-primary/10 text-primary/40 group-hover:bg-accent group-hover:text-white transition-all">
                          <MessageSquare className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-bold text-primary leading-tight">{feedback.title}</p>
                          <p className="text-xs text-primary/60 mt-1">{feedback.description.substring(0, 50)}...</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4 text-center">
                      <Badge className="rounded-tl-sm rounded-br-sm rounded-tr-none rounded-bl-none font-bold text-[9px] uppercase tracking-widest bg-blue-500 text-white border-none px-3">
                        {feedback.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-6 py-4 text-center">
                      <Badge className={cn(
                        "rounded-tl-sm rounded-br-sm rounded-tr-none rounded-bl-none font-bold text-[9px] uppercase tracking-widest border-none px-3",
                        feedback.status === 'active' ? 'bg-green-500 text-white' :
                          feedback.status === 'closed' ? 'bg-primary/20 text-primary/60' :
                            'bg-yellow-500 text-white'
                      )}>
                        {feedback.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-6 py-4 text-center">
                      <span className="text-xs font-bold text-primary capitalize">{feedback.targetAudience}</span>
                    </TableCell>
                    <TableCell className="px-6 py-4 text-center">
                      <div className="flex flex-col items-center">
                        <span className="font-bold text-primary">{feedback.questions.length}</span>
                        <span className="text-[9px] uppercase font-black text-primary/30">Questions</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2  transition-opacity">
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                          className="h-8 shadow-none hover:bg-blue-500/10 rounded-tl-md rounded-br-md rounded-tr-none rounded-bl-none"
                        >
                          <Link href={`/admin/feedback/${feedback.id}/results`}>
                            <BarChart3 className="h-4 w-4 text-blue-500" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                          className="h-8 shadow-none hover:bg-primary/5 rounded-tl-md rounded-br-md rounded-tr-none rounded-bl-none"
                        >
                          <Link href={`/admin/feedback/${feedback.id}`}>
                            <Edit className="h-4 w-4 text-primary" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 shadow-none hover:bg-accent/10 hover:text-accent rounded-tl-md rounded-br-md rounded-tr-none rounded-bl-none"
                          onClick={(e) => { e.stopPropagation(); handleDelete(feedback.id); }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredFeedback.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-20 text-primary/40 font-bold uppercase tracking-widest">
                      No feedback cycles found matching filters
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
