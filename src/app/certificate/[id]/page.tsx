'use client';
import { useMemo, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useFirestore, useDoc } from '@/firebase';
import { getFirestore } from 'firebase/firestore';
import { useFirebaseApp } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { Certificate } from '@/lib/certificate-types';
import type { BrandingSettings } from '@/lib/settings-types';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Printer, Award, CheckCircle, Download, Share2, ExternalLink } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export default function CertificatePublicPage() {
    const params = useParams();
    const router = useRouter();
    const firebaseApp = useFirebaseApp();
    const [copied, setCopied] = useState(false);

    const certId = Array.isArray(params.id) ? params.id[0] : params.id as string;

    // Certificates live in the kenyasales database
    const kenyasalesDb = useMemo(() => {
        if (!firebaseApp) return null;
        return getFirestore(firebaseApp, 'kenyasales');
    }, [firebaseApp]);

    const defaultDb = useFirestore();

    const certRef = useMemo(
        () => kenyasalesDb && certId ? doc(kenyasalesDb, 'certificates', certId) : null,
        [kenyasalesDb, certId]
    );
    const { data: cert, loading: certLoading } = useDoc<Certificate>(certRef as any);

    const brandingRef = useMemo(
        () => defaultDb ? doc(defaultDb, 'settings', 'branding') : null,
        [defaultDb]
    );
    const { data: branding } = useDoc<BrandingSettings>(brandingRef as any);

    const handlePrint = () => window.print();

    const handleShare = async () => {
        const url = window.location.href;
        if (navigator.share) {
            await navigator.share({ title: `Certificate – ${cert?.learnerName}`, url });
        } else {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    if (certLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-12 w-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                    <p className="text-xs font-black uppercase tracking-widest text-primary/40">Loading certificate…</p>
                </div>
            </div>
        );
    }

    if (!cert) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-6 p-8">
                <div className="w-20 h-20 rounded-tl-3xl rounded-br-3xl bg-primary/5 flex items-center justify-center">
                    <Award className="h-10 w-10 text-primary/20" />
                </div>
                <p className="text-primary/40 font-black uppercase tracking-widest text-sm text-center">Certificate not found</p>
                <Button variant="outline" onClick={() => router.back()} className="rounded-tl-lg rounded-br-lg rounded-tr-none rounded-bl-none">
                    <ArrowLeft className="h-4 w-4 mr-2" /> Go Back
                </Button>
            </div>
        );
    }

    const issueDate   = cert.issuedDate   ? format(cert.issuedDate.toDate(),   'MMMM d, yyyy') : 'N/A';
    const completedDate = cert.completedAt ? format(cert.completedAt.toDate(), 'MMMM d, yyyy') : issueDate;
    const orgName = 'Kenya School of Science';

    return (
        <>
            {/* ── Print styles ── */}
            <style>{`
                @media print {
                    .no-print { display: none !important; }
                    body { margin: 0; background: white; }
                    #cert-document {
                        position: fixed;
                        inset: 0;
                        width: 100vw;
                        height: 100vh;
                        margin: 0;
                        box-shadow: none !important;
                        border: none !important;
                    }
                }
            `}</style>

            <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-50 to-white font-body">

                {/* ── Top bar ── */}
                <div className="no-print sticky top-0 z-50 bg-white/80 backdrop-blur border-b border-primary/10 px-4 md:px-8 py-3 flex items-center justify-between gap-4">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.back()}
                        className="rounded-tl-lg rounded-br-lg rounded-tr-none rounded-bl-none text-primary/60 hover:text-primary hover:bg-primary/5"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" /> Back
                    </Button>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleShare}
                            className="rounded-tl-lg rounded-br-lg rounded-tr-none rounded-bl-none border-primary/20 text-primary/60 hover:text-primary"
                        >
                            <Share2 className="h-3.5 w-3.5 mr-1.5" />
                            {copied ? 'Link copied!' : 'Share'}
                        </Button>
                        <Button
                            size="sm"
                            onClick={handlePrint}
                            className="bg-primary hover:bg-primary/90 text-white rounded-tl-lg rounded-br-lg rounded-tr-none rounded-bl-none shadow-md"
                        >
                            <Printer className="h-3.5 w-3.5 mr-1.5" /> Print / Save PDF
                        </Button>
                    </div>
                </div>

                {/* ── Meta info strip ── */}
                <div className="no-print max-w-4xl mx-auto px-4 md:px-8 pt-8 pb-4 flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-primary/30 mb-1">Certificate</p>
                        <h1 className="text-lg font-black text-primary leading-tight">
                            {cert.isLegacy ? 'Legacy Certificate' : (cert.courseTitle || cert.programTitle)}
                        </h1>
                        {!cert.isLegacy && (
                            <p className="text-xs text-primary/50 mt-0.5">{cert.learnerName}</p>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-[9px] font-black uppercase tracking-widest bg-primary/5 text-primary/50 px-3 py-1.5 rounded-tl-md rounded-br-md">
                            #{certId}
                        </span>
                        {cert.isLegacy && (
                            <span className="text-[9px] font-black uppercase tracking-widest bg-amber-50 text-amber-600 border border-amber-200 px-3 py-1.5 rounded-tl-md rounded-br-md">
                                Legacy
                            </span>
                        )}
                    </div>
                </div>

                {/* ── Certificate document ── */}
                <div className="max-w-4xl mx-auto px-4 md:px-8 pb-16">
                    {cert.isLegacy && cert.certificateUrl ? (
                        /* ── Legacy: show the scanned image ── */
                        <div id="cert-document" className="bg-white shadow-2xl rounded-tl-2xl rounded-br-2xl overflow-hidden border border-primary/10">
                            <div className="h-2 w-full bg-gradient-to-r from-primary via-accent to-primary" />
                            <div className="p-4 md:p-8 flex justify-center">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={cert.certificateUrl}
                                    alt={`Certificate ${certId}`}
                                    className="w-full max-w-3xl object-contain rounded-sm shadow-sm"
                                />
                            </div>
                            <div className="h-1.5 w-full bg-gradient-to-r from-primary via-accent to-primary" />
                        </div>
                    ) : (
                        /* ── System-generated: rendered HTML certificate ── */
                        <div id="cert-document" className="bg-white shadow-2xl border border-primary/10 rounded-tl-2xl rounded-br-2xl overflow-hidden">

                            {/* Top accent */}
                            <div className="h-3 w-full bg-gradient-to-r from-primary via-accent to-primary" />

                            <div className="px-8 md:px-16 py-12 flex flex-col items-center text-center relative">

                                {/* Corner ornaments */}
                                <div className="absolute top-6 left-6 w-14 h-14 border-t-2 border-l-2 border-accent/25 pointer-events-none" />
                                <div className="absolute top-6 right-6 w-14 h-14 border-t-2 border-r-2 border-accent/25 pointer-events-none" />
                                <div className="absolute bottom-6 left-6 w-14 h-14 border-b-2 border-l-2 border-accent/25 pointer-events-none" />
                                <div className="absolute bottom-6 right-6 w-14 h-14 border-b-2 border-r-2 border-accent/25 pointer-events-none" />

                                {/* Logo */}
                                <div className="mb-6">
                                    {branding?.logoUrl ? (
                                        <div className="relative h-16 w-52 mx-auto">
                                            <Image src={branding.logoUrl} alt={orgName} fill sizes="210px" className="object-contain" />
                                        </div>
                                    ) : (
                                        <div className="text-4xl font-black tracking-widest text-primary">KSS</div>
                                    )}
                                </div>

                                {/* Organisation name */}
                                <p className="text-[10px] font-black uppercase tracking-[0.35em] text-accent mb-1">{orgName}</p>

                                {/* Certificate title */}
                                <h1 className="text-2xl md:text-4xl font-black uppercase tracking-widest text-primary mb-1">
                                    Certificate of {cert.programType === 'Short' || cert.programType === 'E-Learning' ? 'Completion' : 'Achievement'}
                                </h1>

                                {/* Divider */}
                                <div className="flex items-center gap-4 my-6 w-full max-w-sm">
                                    <div className="flex-1 h-px bg-gradient-to-r from-transparent to-accent/50" />
                                    <Award className="h-5 w-5 text-accent flex-shrink-0" />
                                    <div className="flex-1 h-px bg-gradient-to-l from-transparent to-accent/50" />
                                </div>

                                <p className="text-xs text-primary/50 uppercase tracking-[0.2em] mb-4">This is to certify that</p>

                                {/* Learner name */}
                                <h2
                                    className="text-3xl md:text-5xl font-bold text-primary mb-1 leading-tight"
                                    style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
                                >
                                    {cert.learnerName}
                                </h2>
                                {cert.learnerEmail && (
                                    <p className="text-[10px] text-primary/35 uppercase tracking-widest mb-8">{cert.learnerEmail}</p>
                                )}

                                <p className="text-xs text-primary/50 uppercase tracking-[0.2em] mb-3">has successfully completed</p>

                                {/* Program / course */}
                                <h3 className="text-xl md:text-2xl font-black text-primary mb-1">
                                    {cert.courseTitle || cert.programTitle}
                                </h3>
                                {cert.courseTitle && cert.programTitle && cert.courseTitle !== cert.programTitle && (
                                    <p className="text-sm text-primary/45 mb-1">{cert.programTitle}</p>
                                )}
                                {cert.cohortName && (
                                    <p className="text-[10px] text-accent font-black uppercase tracking-widest mt-1 mb-2">{cert.cohortName}</p>
                                )}
                                {cert.programType && (
                                    <span className="text-[9px] font-black uppercase tracking-widest bg-accent/10 text-accent px-3 py-1 rounded-full mt-1">
                                        {cert.programType} Programme
                                    </span>
                                )}

                                {/* Dates */}
                                <div className="flex flex-col md:flex-row items-center justify-center gap-10 my-10">
                                    <div className="text-center">
                                        <p className="text-[8px] font-black uppercase tracking-widest text-primary/35 mb-1">Date Completed</p>
                                        <p className="text-base font-bold text-primary">{completedDate}</p>
                                    </div>
                                    <div className="hidden md:block w-px h-10 bg-primary/10" />
                                    <div className="text-center">
                                        <p className="text-[8px] font-black uppercase tracking-widest text-primary/35 mb-1">Date Issued</p>
                                        <p className="text-base font-bold text-primary">{issueDate}</p>
                                    </div>
                                </div>

                                {/* Signature lines */}
                                <div className="flex flex-col md:flex-row justify-around w-full max-w-lg gap-10 mb-10">
                                    <div className="flex flex-col items-center gap-1">
                                        <div className="w-36 border-b border-primary/25 mb-2" />
                                        <p className="text-[8px] font-black uppercase tracking-widest text-primary/40">Director</p>
                                        <p className="text-[9px] text-primary/30">{orgName}</p>
                                    </div>
                                    <div className="flex flex-col items-center gap-1">
                                        <div className="w-36 border-b border-primary/25 mb-2" />
                                        <p className="text-[8px] font-black uppercase tracking-widest text-primary/40">Programme Director</p>
                                        <p className="text-[9px] text-primary/30">{cert.programTitle}</p>
                                    </div>
                                </div>

                                {/* Verification badge */}
                                <div className="flex items-center gap-2 border border-green-200 bg-green-50 rounded-tl-lg rounded-br-lg px-4 py-2">
                                    <CheckCircle className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
                                    <span className="text-[9px] font-black uppercase tracking-widest text-green-700">
                                        Verified · Certificate No. {certId}
                                    </span>
                                </div>
                            </div>

                            {/* Bottom accent */}
                            <div className="h-2 w-full bg-gradient-to-r from-primary via-accent to-primary" />
                        </div>
                    )}

                    {/* ── Action strip below certificate ── */}
                    <div className="no-print mt-6 flex flex-wrap items-center justify-between gap-4 px-1">
                        <p className="text-[10px] text-primary/30 font-medium">
                            To save as PDF: click <strong>Print / Save PDF</strong> → choose <em>Save as PDF</em> in your printer dialog.
                        </p>
                        <div className="flex items-center gap-2">
                            {cert.isLegacy && cert.certificateUrl && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    asChild
                                    className="rounded-tl-lg rounded-br-lg rounded-tr-none rounded-bl-none border-primary/20 text-primary/60 hover:text-primary text-xs"
                                >
                                    <a href={cert.certificateUrl} download target="_blank" rel="noreferrer">
                                        <Download className="h-3.5 w-3.5 mr-1.5" /> Download Image
                                    </a>
                                </Button>
                            )}
                            <Button
                                size="sm"
                                onClick={handlePrint}
                                className="bg-primary hover:bg-primary/90 text-white rounded-tl-lg rounded-br-lg rounded-tr-none rounded-bl-none shadow-md text-xs"
                            >
                                <Printer className="h-3.5 w-3.5 mr-1.5" /> Print / Save PDF
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
