'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, RefreshCw, Search, Award, Calendar, ExternalLink, Download, User as UserIcon, Cpu, ImageIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { useUsersFirestore, useCollection } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import type { Certificate } from '@/lib/certificate-types';
import { format } from 'date-fns';
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

export default function AdminCertificatesPage() {
  const firestore = useUsersFirestore();
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 20;

  const certificatesQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'certificates'), orderBy('issuedDate', 'desc'));
  }, [firestore]);

  const { data: allCertificates, loading } = useCollection<Certificate>(certificatesQuery as any);

  const filteredCertificates = useMemo(() => {
    if (!allCertificates) return [];
    return allCertificates.filter(c => {
      const matchesSearch = c.learnerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.programTitle.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    });
  }, [allCertificates, searchQuery]);

  // Reset to page 1 whenever search changes
  const totalPages = Math.max(1, Math.ceil(filteredCertificates.length / PAGE_SIZE));
  const pagedCertificates = filteredCertificates.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

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
        {/* Admin Certificates Hero Section */}
        <div className="bg-primary text-white p-6 mb-6 border-b border-primary/10 rounded-tl-3xl rounded-br-3xl rounded-tr-none rounded-bl-none shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-accent/20 rounded-full blur-3xl opacity-20" />

          <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Award className="h-8 w-8 bg-accent/20 p-1.5 rounded-lg text-accent" />
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Credential Registry</h1>
              </div>
              <p className="text-white/80 text-lg font-medium">Issue, verify and audit all academic credentials across the system</p>
            </div>
            <div className="flex items-center gap-3">

              <Button className="bg-secondary hover:bg-secondary/90 text-white border-none h-12 px-6 rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none font-bold shadow-lg transition-all" asChild>
                <Link href="/a/certificates/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Issue New
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Search Row */}
        <div className="flex flex-col lg:flex-row gap-4 mb-6 items-end">
          <div className="relative flex-1 group w-full">
            <label className="text-xs font-bold text-primary/40 uppercase tracking-widest ml-1 mb-2 block">Search Credentials</label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary/30 group-focus-within:text-primary transition-colors" />
              <Input
                placeholder="Search by learner name or program title..."
                className="pl-12 h-14 bg-white border-primary/10 rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none focus:ring-primary focus:border-primary shadow-sm text-base font-medium"
                value={searchQuery}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              />
            </div>
          </div>
        </div>

        {/* Certificates Table */}
        <div className="w-full bg-white shadow-lg border border-primary/10 overflow-hidden rounded-tl-2xl rounded-br-2xl rounded-tr-none rounded-bl-none">
          <div className="overflow-x-auto">
            <Table className="w-full">
              <TableHeader className="bg-primary/5 border-b border-primary/10">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest w-12">ID</TableHead>
                  <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest">Learner Recipient</TableHead>
                  <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest text-center">Accredited Program</TableHead>
                  <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest">Issue Date</TableHead>
                  <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-primary/10">
                {pagedCertificates.map((cert) => (
                  <TableRow key={cert.id} className="hover:bg-primary/5 cursor-pointer transition-colors group border-primary/10">
                    <TableCell className="px-6 py-4 font-black text-primary/30 text-xs text-center">
                      #{cert.id}
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 flex items-center justify-center rounded-tl-lg rounded-br-lg bg-primary/10 text-primary/40 group-hover:bg-accent group-hover:text-white transition-all">
                          <UserIcon className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-bold text-primary leading-tight">{cert.learnerName}</p>
                          <p className="text-[10px] text-primary/40 font-medium mt-0.5">{cert.learnerEmail}</p>
                          {cert.isSystemGenerated && (
                            <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-accent mt-0.5">
                              <Cpu className="h-2.5 w-2.5" /> Auto-issued
                            </span>
                          )}
                          {cert.isLegacy && (
                            <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-amber-500 mt-0.5">
                              <ImageIcon className="h-2.5 w-2.5" /> Legacy · {cert.sourceFilename}
                            </span>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <Badge className="bg-primary/5 text-primary border-none font-bold text-[9px] uppercase tracking-widest px-3">
                          {cert.courseTitle || cert.programTitle}
                        </Badge>
                        {cert.programType && (
                          <span className="text-[8px] font-black uppercase tracking-widest text-primary/30">{cert.programType}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <div className="flex items-center gap-2 text-xs text-primary/70 font-medium">
                        <Calendar className="h-3 w-3 text-accent" />
                        {cert.issuedDate ? format(cert.issuedDate.toDate(), 'MMM d, yyyy') : 'N/A'}
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2  transition-opacity">
                        <Button
                          asChild
                          variant="ghost"
                          size="sm"
                          className="h-8 shadow-none hover:bg-primary/5 rounded-tl-md rounded-br-md rounded-tr-none rounded-bl-none text-[10px] uppercase font-black tracking-widest"
                        >
                          <Link href={`/certificate/${cert.id}`} target="_blank">
                            <Download className="h-4 w-4 mr-2" /> View / Print
                          </Link>
                        </Button>
                        <Button
                          asChild
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 border border-primary/10 rounded-tl-md rounded-br-md rounded-tr-none rounded-bl-none hover:bg-accent/10 hover:text-accent"
                        >
                          <Link href={`/certificate/${cert.id}`} target="_blank">
                            <ExternalLink className="h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredCertificates.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-20 text-primary/40 font-bold uppercase tracking-widest">
                      No issued certificates found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 px-2">
            <p className="text-xs text-primary/40 font-medium">
              Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filteredCertificates.length)} of {filteredCertificates.length}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 border border-primary/10 rounded-tl-md rounded-br-md rounded-tr-none rounded-bl-none hover:bg-primary/5 disabled:opacity-30"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-xs font-black text-primary/60 tracking-widest uppercase px-2">
                {currentPage} / {totalPages}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 border border-primary/10 rounded-tl-md rounded-br-md rounded-tr-none rounded-bl-none hover:bg-primary/5 disabled:opacity-30"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
