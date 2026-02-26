'use client';
import { useMemo, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useFirestore, useUser, useDoc, useCollection } from '@/firebase';
import { doc, collection, query, where } from 'firebase/firestore';
import type { Certificate } from '@/lib/certificate-types';
import type { BrandingSettings } from '@/lib/settings-types';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download, Award, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';

export default function CertificateViewPage() {
    const params = useParams();
    const router = useRouter();
    const firestore = useFirestore();
    const { user } = useUser();
    const printRef = useRef<HTMLDivElement>(null);

    const certId = Array.isArray(params.id) ? params.id[0] : params.id;

    const certRef = useMemo(() => firestore && certId ? doc(firestore, 'certificates', certId) : null, [firestore, certId]);
    const { data: cert, loading: certLoading } = useDoc<Certificate>(certRef as any);

    const settingsRef = useMemo(() => firestore ? doc(firestore, 'settings', 'branding') : null, [firestore]);
    const { data: branding } = useDoc<BrandingSettings>(settingsRef as any);

    const handlePrint = () => {
        window.print();
    };

    if (certLoading) {
        return (
            <div className="p-8 flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
            </div>
        );
    }

    if (!cert) {
        return (
            <div className="p-8 flex flex-col items-center justify-center min-h-screen gap-4">
                <Award className="h-16 w-16 text-primary/20" />
                <p className="text-primary/40 font-bold uppercase tracking-widest text-sm">Certificate not found</p>
                <Button variant="outline" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4 mr-2" /> Back
                </Button>
            </div>
        );
    }

    const issueDate = cert.issuedDate ? format(cert.issuedDate.toDate(), 'MMMM d, yyyy') : 'N/A';
    const completedDate = cert.completedAt ? format(cert.completedAt.toDate(), 'MMMM d, yyyy') : issueDate;

    return (
        <>
            {/* Print styles — hidden in normal view, only used when printing */}
            <style>{`
                @media print {
                    body * { visibility: hidden; }
                    #certificate-printable, #certificate-printable * { visibility: visible; }
                    #certificate-printable {
                        position: fixed;
                        top: 0; left: 0;
                        width: 100vw; height: 100vh;
                        margin: 0; padding: 0;
                    }
                    .no-print { display: none !important; }
                }
            `}</style>

            {/* Screen controls */}
            <div className="no-print w-full bg-gray-50/50 p-4 md:p-8 font-body">
                <div className="flex items-center justify-between mb-6">
                    <Button variant="outline" onClick={() => router.back()} className="rounded-tl-md rounded-br-md rounded-tr-none rounded-bl-none">
                        <ArrowLeft className="h-4 w-4 mr-2" /> Back to Certificates
                    </Button>
                    <Button onClick={handlePrint} className="bg-accent hover:bg-accent/90 text-white rounded-tl-md rounded-br-md rounded-tr-none rounded-bl-none shadow-lg">
                        <Download className="h-4 w-4 mr-2" /> Download / Print PDF
                    </Button>
                </div>
            </div>

            {/* Certificate — printable */}
            <div className="w-full flex justify-center px-4 pb-12 font-body" id="certificate-printable" ref={printRef}>
                <div className="w-full max-w-4xl bg-white shadow-2xl border-2 border-primary/10 rounded-none" style={{ minHeight: '600px' }}>

                    {/* Top accent bar */}
                    <div className="h-3 w-full bg-gradient-to-r from-primary via-accent to-primary" />

                    {/* Certificate body */}
                    <div className="px-12 py-10 flex flex-col items-center text-center relative">

                        {/* Corner ornaments */}
                        <div className="absolute top-4 left-4 w-16 h-16 border-t-2 border-l-2 border-accent/30" />
                        <div className="absolute top-4 right-4 w-16 h-16 border-t-2 border-r-2 border-accent/30" />
                        <div className="absolute bottom-4 left-4 w-16 h-16 border-b-2 border-l-2 border-accent/30" />
                        <div className="absolute bottom-4 right-4 w-16 h-16 border-b-2 border-r-2 border-accent/30" />

                        {/* Logo */}
                        <div className="mb-6">
                            {branding?.logoUrl ? (
                                <div className="relative h-16 w-48 mx-auto">
                                    <Image
                                        src={branding.logoUrl}
                                        alt="KSS Logo"
                                        fill
                                        sizes="200px"
                                        className="object-contain"
                                    />
                                </div>
                            ) : (
                                <div className="text-3xl font-black tracking-widest text-primary">KSS</div>
                            )}
                        </div>

                        {/* Title */}
                        <div className="mb-2">
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-accent mb-1">Kenya School of Science</p>
                            <h1 className="text-2xl md:text-3xl font-black uppercase tracking-widest text-primary">
                                Certificate of {cert.programType === 'Short' ? 'Completion' : 'Achievement'}
                            </h1>
                        </div>

                        {/* Decorative divider */}
                        <div className="flex items-center gap-3 my-6 w-full max-w-md">
                            <div className="flex-1 h-px bg-gradient-to-r from-transparent to-accent/40" />
                            <Award className="h-6 w-6 text-accent" />
                            <div className="flex-1 h-px bg-gradient-to-l from-transparent to-accent/40" />
                        </div>

                        {/* "This certifies that" */}
                        <p className="text-sm text-primary/60 uppercase tracking-widest mb-3">This is to certify that</p>

                        {/* Learner name */}
                        <h2 className="text-3xl md:text-4xl font-bold text-primary mb-1" style={{ fontFamily: 'Georgia, serif' }}>
                            {cert.learnerName}
                        </h2>
                        <p className="text-xs text-primary/40 uppercase tracking-widest mb-6">{cert.learnerEmail}</p>

                        {/* Achievement statement */}
                        <p className="text-sm text-primary/60 uppercase tracking-widest mb-2">
                            has successfully completed
                        </p>
                        <h3 className="text-xl md:text-2xl font-black text-primary mb-1">
                            {cert.courseTitle || cert.programTitle}
                        </h3>
                        {cert.courseTitle && cert.programTitle && cert.courseTitle !== cert.programTitle && (
                            <p className="text-sm text-primary/50 mb-1">{cert.programTitle}</p>
                        )}
                        {cert.cohortName && (
                            <p className="text-[10px] text-accent uppercase font-black tracking-widest mb-4">{cert.cohortName}</p>
                        )}

                        {/* Dates */}
                        <div className="flex flex-col md:flex-row items-center justify-center gap-8 my-8">
                            <div className="text-center">
                                <p className="text-[9px] font-black uppercase tracking-widest text-primary/40 mb-1">Completed</p>
                                <p className="text-base font-bold text-primary">{completedDate}</p>
                            </div>
                            <div className="hidden md:block w-px h-10 bg-primary/10" />
                            <div className="text-center">
                                <p className="text-[9px] font-black uppercase tracking-widest text-primary/40 mb-1">Issued</p>
                                <p className="text-base font-bold text-primary">{issueDate}</p>
                            </div>
                        </div>

                        {/* Verification */}
                        <div className="flex items-center gap-2 mt-2 mb-6">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-primary/40">
                                Verified Certificate · Ref: {cert.id}
                            </span>
                        </div>

                        {/* Signature line */}
                        <div className="flex flex-col md:flex-row justify-around w-full max-w-lg mt-4 gap-8">
                            <div className="flex flex-col items-center">
                                <div className="w-32 border-b border-primary/30 mb-1" />
                                <p className="text-[9px] font-black uppercase tracking-widest text-primary/40">Director</p>
                                <p className="text-[9px] text-primary/40">Kenya School of Science</p>
                            </div>
                            <div className="flex flex-col items-center">
                                <div className="w-32 border-b border-primary/30 mb-1" />
                                <p className="text-[9px] font-black uppercase tracking-widest text-primary/40">Programme Director</p>
                                <p className="text-[9px] text-primary/40">{cert.programTitle}</p>
                            </div>
                        </div>
                    </div>

                    {/* Bottom accent bar */}
                    <div className="h-2 w-full bg-gradient-to-r from-primary via-accent to-primary" />
                </div>
            </div>
        </>
    );
}
