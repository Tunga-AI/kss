'use client';
import { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, MessageSquare, Calendar, CheckCircle, Search, ChevronDown, ArrowRight } from "lucide-react";
import { useFirestore, useUser } from '@/firebase';
import type { FeedbackCycle } from '@/lib/feedback-types';
import { cn } from "@/lib/utils";
import { getFeedbackCyclesForUser, hasUserResponded } from '@/lib/feedback';
import { Input } from "@/components/ui/input";
import { format } from "date-fns";

export default function FacilitatorFeedbackPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const [availableFeedback, setAvailableFeedback] = useState<FeedbackCycle[]>([]);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    if (!firestore || !user) return;

    const loadFeedback = async () => {
      try {
        const cycles = await getFeedbackCyclesForUser(firestore, user.id, user.role);
        setAvailableFeedback(cycles);

        // Check which ones user has responded to
        const completed = new Set<string>();
        for (const cycle of cycles) {
          const responded = await hasUserResponded(firestore, cycle.id, user.id);
          if (responded) {
            completed.add(cycle.id);
          }
        }
        setCompletedIds(completed);
      } catch (error) {
        console.error('Error loading feedback:', error);
      } finally {
        setLoading(false);
      }
    };

    loadFeedback();
  }, [firestore, user]);

  const filteredFeedback = useMemo(() => {
    return availableFeedback.filter(f => {
      const isCompleted = completedIds.has(f.id);
      const matchesSearch = f.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.description.toLowerCase().includes(searchQuery.toLowerCase());

      let matchesStatus = true;
      if (statusFilter === 'pending') matchesStatus = !isCompleted;
      if (statusFilter === 'completed') matchesStatus = isCompleted;

      return matchesSearch && matchesStatus;
    });
  }, [availableFeedback, completedIds, searchQuery, statusFilter]);

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
        {/* Hero Section */}
        <div className="bg-primary text-white p-6 mb-6 border-b border-primary/10 rounded-tl-3xl rounded-br-3xl rounded-tr-none rounded-bl-none shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-accent/20 rounded-full blur-3xl opacity-20" />

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-2">
              <MessageSquare className="h-8 w-8 bg-accent/20 p-1.5 rounded-lg text-accent" />
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Feedback Center</h1>
            </div>
            <p className="text-white/80 text-lg font-medium">Share your insights to help improve the platform</p>
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
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-4 items-end w-full lg:w-auto">
            <DropdownCard
              label="Filter By Status"
              value={statusFilter}
              onChange={(val: string) => setStatusFilter(val)}
              options={[
                { value: 'all', label: 'All Feedback' },
                { value: 'pending', label: 'Pending' },
                { value: 'completed', label: 'Completed' }
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
                  <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest">Feedback Details</TableHead>
                  <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest text-center">Type</TableHead>
                  <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest text-center">Questions</TableHead>
                  <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest text-center">Due Date</TableHead>
                  <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest text-center">Status</TableHead>
                  <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-primary/10">
                {filteredFeedback.map((feedback) => {
                  const isCompleted = completedIds.has(feedback.id);
                  return (
                    <TableRow key={feedback.id} className="hover:bg-primary/5 transition-colors group border-primary/10">
                      <TableCell className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "h-10 w-10 flex items-center justify-center rounded-tl-lg rounded-br-lg rounded-tr-none rounded-bl-none transition-all",
                            isCompleted ? "bg-green-500/10 text-green-500" : "bg-accent/10 text-accent"
                          )}>
                            {isCompleted ? <CheckCircle className="h-5 w-5" /> : <MessageSquare className="h-5 w-5" />}
                          </div>
                          <div>
                            <p className="font-bold text-primary leading-tight">{feedback.title}</p>
                            <p className="text-[10px] text-primary/60 mt-0.5 uppercase tracking-tighter line-clamp-1 max-w-[300px]">
                              {feedback.description}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-4 text-center">
                        <Badge variant="outline" className="rounded-tl-sm rounded-br-sm rounded-tr-none rounded-bl-none font-bold text-[9px] uppercase tracking-widest px-2 py-0.5 border-primary/20 bg-primary/5 text-primary">
                          {feedback.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-6 py-4 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <div className="flex items-center gap-1 text-[10px] font-bold text-primary/70">
                            <MessageSquare className="h-3 w-3" />
                            {feedback.questions.length} Questions
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-1 text-[10px] font-bold text-primary/60">
                          <Calendar className="h-3 w-3" />
                          {feedback.endDate ? format(feedback.endDate.toDate(), 'MMM d, yyyy') : 'No Date'}
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-4 text-center">
                        <Badge className={cn(
                          "rounded-tl-sm rounded-br-sm rounded-tr-none rounded-bl-none font-bold text-[9px] uppercase tracking-widest border-none px-3",
                          isCompleted ? 'bg-green-500 text-white' : 'bg-accent text-white'
                        )}>
                          {isCompleted ? 'Completed' : 'Pending'}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-6 py-4 text-right">
                        <Button
                          size="sm"
                          asChild
                          variant={isCompleted ? "ghost" : "default"}
                          className={cn(
                            "h-8 rounded-tl-md rounded-br-md rounded-tr-none rounded-bl-none transition-all shadow-none",
                            isCompleted
                              ? "bg-transparent hover:bg-primary/5 text-primary/60"
                              : "bg-primary hover:bg-primary/90 text-white"
                          )}
                        >
                          <Link href={`/f/feedback/${feedback.id}`}>
                            {isCompleted ? (
                              <>
                                <CheckCircle className="h-3.5 w-3.5 mr-2" />
                                Reviewed
                              </>
                            ) : (
                              <>
                                Respond
                                <ArrowRight className="h-3.5 w-3.5 ml-2" />
                              </>
                            )}
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filteredFeedback.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-20">
                      <div className="flex flex-col items-center gap-2">
                        <MessageSquare className="h-12 w-12 text-primary/10" />
                        <p className="text-primary/40 font-bold uppercase tracking-widest text-xs">No feedback cycles found</p>
                      </div>
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
