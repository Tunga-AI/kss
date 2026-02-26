'use client';
import { useMemo } from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Award, Download, RefreshCw, Calendar, ExternalLink, Cpu } from 'lucide-react';
import { useFirestore, useUser, useCollection } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import type { Certificate } from '@/lib/certificate-types';
import { format } from 'date-fns';
import { cn } from "@/lib/utils";

export default function LearnerCertificatesPage() {
  const { user, loading: userLoading } = useUser();
  const firestore = useFirestore();

  const certificatesQuery = useMemo(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'certificates'), where('learnerEmail', '==', user.email));
  }, [firestore, user]);

  const { data: certificates, loading: certsLoading } = useCollection<Certificate>(certificatesQuery as any);

  const loading = userLoading || certsLoading;

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gray-50/50 p-4 md:p-8 font-body">
      <div className="w-full">
        {/* Hero Section */}
        <div className="bg-primary text-white p-8 mb-8 border-b border-primary/10 rounded-tl-3xl rounded-br-3xl rounded-tr-none rounded-bl-none shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-accent/20 rounded-full blur-3xl opacity-20" />

          <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Award className="h-8 w-8 bg-accent/20 p-1.5 rounded-lg text-accent" />
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Achievements & Certificates</h1>
              </div>
              <p className="text-white/80 text-lg font-medium">Verify your skills and accomplishments with official documentation</p>
            </div>

            <div className="flex gap-4">
              <div className="bg-white/10 px-6 py-3 rounded-tl-xl rounded-br-xl backdrop-blur-sm border border-white/10">
                <p className="text-2xl font-bold">{certificates?.length || 0}</p>
                <p className="text-[10px] uppercase font-black tracking-widest text-white/60">Verified Credentials</p>
              </div>
            </div>
          </div>
        </div>

        {/* Certificates Table */}
        <div className="w-full bg-white shadow-lg border border-primary/10 overflow-hidden rounded-tl-2xl rounded-br-2xl rounded-tr-none rounded-bl-none">
          <div className="overflow-x-auto">
            <Table className="w-full">
              <TableHeader className="bg-primary/5 border-b border-primary/10">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest">Credential</TableHead>
                  <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest text-center">Reference ID</TableHead>
                  <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest">Issue Date</TableHead>
                  <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-primary/10">
                {certificates && certificates.map((cert) => (
                  <TableRow key={cert.id} className="hover:bg-primary/5 transition-colors group border-primary/10">
                    <TableCell className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 flex items-center justify-center rounded-tl-lg rounded-br-lg bg-yellow-400/10 text-yellow-600 group-hover:bg-yellow-400 group-hover:text-white transition-all">
                          <Award className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-bold text-primary leading-tight">{cert.courseTitle || cert.programTitle}</p>
                          {cert.courseTitle && cert.programTitle && cert.courseTitle !== cert.programTitle && (
                            <p className="text-[10px] text-primary/40 uppercase font-black mt-0.5">{cert.programTitle}</p>
                          )}
                          <div className="flex items-center gap-2 mt-1">
                            {cert.isSystemGenerated && (
                              <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-accent">
                                <Cpu className="h-2.5 w-2.5" /> System Generated
                              </span>
                            )}
                            {cert.programType && (
                              <Badge variant="outline" className="text-[8px] px-1.5 py-0 h-4 font-black uppercase border-primary/20 text-primary/40">
                                {cert.programType}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4 text-center">
                      <code className="text-[10px] font-mono bg-primary/5 px-2 py-1 rounded text-primary/60 border border-primary/10">
                        {cert.id.substring(0, 8).toUpperCase()}
                      </code>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm font-bold text-primary/80">
                        <Calendar className="h-3 w-3 text-accent" />
                        {cert.issuedDate ? format(cert.issuedDate.toDate(), 'MMMM d, yyyy') : 'N/A'}
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          asChild
                          variant="ghost"
                          size="sm"
                          className="h-9 px-4 font-bold text-[10px] uppercase tracking-widest rounded-tl-md rounded-br-md rounded-tr-none rounded-bl-none border border-primary/10 hover:bg-primary/5"
                        >
                          <Link href={`/certificate/${cert.id}`}>
                            <Download className="h-4 w-4 mr-2" /> View / Download
                          </Link>
                        </Button>
                        <Button
                          asChild
                          variant="ghost"
                          size="sm"
                          className="h-9 w-9 p-0 border border-primary/10 rounded-tl-md rounded-br-md rounded-tr-none rounded-bl-none hover:bg-accent/10 hover:text-accent"
                        >
                          <Link href={`/certificate/${cert.id}`} target="_blank">
                            <ExternalLink className="h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {(!certificates || certificates.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-20">
                      <div className="flex flex-col items-center gap-2">
                        <Award className="h-12 w-12 text-primary/10" />
                        <p className="text-primary/40 font-bold uppercase tracking-widest text-xs">No certificates earned yet</p>
                        <Link href="/l/courses" className="text-accent font-bold text-[10px] uppercase tracking-widest mt-4 hover:underline">Start a program today</Link>
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
