'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, RefreshCw, Search, ChevronDown, FileText, Video, Package, Folder, Eye, Play, BookOpen, Upload, Trash2 } from "lucide-react";
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, where, orderBy, doc, deleteDoc } from 'firebase/firestore';
import type { ContentItem } from '@/lib/content-library-types';
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

export default function FacilitatorContentLibraryPage() {
    const firestore = useFirestore();
    const [searchQuery, setSearchQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');

    const contentQuery = useMemo(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'contentLibrary'), orderBy('createdAt', 'desc'));
    }, [firestore]);

    const { data: allContent, loading } = useCollection<ContentItem>(contentQuery as any);

    const filteredContent = useMemo(() => {
        if (!allContent) return [];
        return allContent.filter(item => {
            const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.description.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesType = typeFilter === 'all' || item.type === typeFilter;
            const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
            return matchesSearch && matchesType && matchesStatus;
        });
    }, [allContent, searchQuery, typeFilter, statusFilter]);

    const getContentIcon = (type: string) => {
        switch (type) {
            case 'video': return <Video className="h-6 w-6" />;
            case 'document': return <FileText className="h-6 w-6" />;
            case 'scorm': return <Package className="h-6 w-6" />;
            default: return <FileText className="h-6 w-6" />;
        }
    };

    const getContentTypeLabel = (type: string) => {
        const labels: Record<string, string> = {
            video: 'Video',
            document: 'Document',
            scorm: 'SCORM',
            h5p: 'Interactive',
            xapi: 'xAPI',
            image: 'Image',
            audio: 'Audio'
        };
        return labels[type] || type;
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };
    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!firestore || !confirm('Are you sure you want to delete this content item? This action cannot be undone.')) return;

        try {
            await deleteDoc(doc(firestore, 'contentLibrary', id));
        } catch (error) {
            console.error("Error deleting content:", error);
            alert("Failed to delete content. Please try again.");
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
                {/* Hero Section */}
                <div className="bg-primary text-white p-6 mb-6 border-b border-primary/10 rounded-tl-3xl rounded-br-3xl rounded-tr-none rounded-bl-none shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-accent/20 rounded-full blur-3xl opacity-20" />

                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <Folder className="h-8 w-8 bg-accent/20 p-1.5 rounded-lg text-accent" />
                                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Content Library</h1>
                            </div>
                            <p className="text-white/80 text-lg font-medium">Browse and upload learning materials for your courses</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="bg-white/10 px-6 py-3 rounded-tl-xl rounded-br-xl backdrop-blur-sm border border-white/10">
                                <p className="text-2xl font-bold">{filteredContent.length}</p>
                                <p className="text-[10px] uppercase font-black tracking-widest text-white/60">Total Resources</p>
                            </div>
                            <Button
                                variant="outline"
                                className="border-white text-white hover:bg-white hover:text-primary h-12 px-6 rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none font-bold transition-all"
                                onClick={() => window.location.reload()}
                            >
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Refresh
                            </Button>
                            <Button className="bg-accent hover:bg-accent/90 text-white border-none h-12 px-6 rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none font-bold shadow-lg transition-all" asChild>
                                <Link href="/f/library/upload">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Upload Content
                                </Link>
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Filters Row */}
                <div className="flex flex-col lg:flex-row gap-4 mb-6 items-end">
                    <div className="relative flex-1 group w-full">
                        <label className="text-xs font-bold text-primary/40 uppercase tracking-widest ml-1 mb-2 block">Search Library</label>
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary/30 group-focus-within:text-primary transition-colors" />
                            <Input
                                placeholder="Search content..."
                                className="pl-12 h-14 bg-white border-primary/10 rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none focus:ring-primary focus:border-primary shadow-sm text-base font-medium"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex gap-4 w-full lg:w-auto">
                        <div className="flex-1 lg:w-48">
                            <label className="text-xs font-bold text-primary/40 uppercase tracking-widest ml-1 mb-2 block">Type</label>
                            <div className="relative">
                                <select
                                    value={typeFilter}
                                    onChange={(e) => setTypeFilter(e.target.value)}
                                    className="w-full appearance-none bg-white border border-primary/10 rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none px-4 py-2 text-sm md:text-base font-bold text-primary focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all cursor-pointer shadow-sm h-14"
                                >
                                    <option value="all">All Types</option>
                                    <option value="video">Videos</option>
                                    <option value="document">Documents</option>
                                    <option value="scorm">SCORM</option>
                                    <option value="h5p">Interactive</option>
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/30 pointer-events-none" />
                            </div>
                        </div>

                        <div className="flex-1 lg:w-48">
                            <label className="text-xs font-bold text-primary/40 uppercase tracking-widest ml-1 mb-2 block">Status</label>
                            <div className="relative">
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="w-full appearance-none bg-white border border-primary/10 rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none px-4 py-2 text-sm md:text-base font-bold text-primary focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all cursor-pointer shadow-sm h-14"
                                >
                                    <option value="all">All Status</option>
                                    <option value="published">Published</option>
                                    <option value="draft">Draft</option>
                                    <option value="archived">Archived</option>
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/30 pointer-events-none" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content List View */}
                <div className="w-full bg-white shadow-lg border border-primary/10 overflow-hidden rounded-tl-2xl rounded-br-2xl rounded-tr-none rounded-bl-none">
                    <div className="overflow-x-auto">
                        <Table className="w-full">
                            <TableHeader className="bg-primary/5 border-b border-primary/10">
                                <TableRow className="hover:bg-transparent">
                                    <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest text-left">Content Title</TableHead>
                                    <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest text-center">Type</TableHead>
                                    <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest text-center">Status</TableHead>
                                    <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest text-center hidden md:table-cell">Size</TableHead>
                                    <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody className="divide-y divide-primary/10">
                                {filteredContent.map((item) => (
                                    <TableRow key={item.id} className="hover:bg-primary/5 transition-colors group border-primary/10">
                                        <TableCell className="px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 flex items-center justify-center rounded-tl-lg rounded-br-lg bg-primary/10 text-primary/40 group-hover:bg-accent group-hover:text-white transition-all shrink-0">
                                                    {getContentIcon(item.type)}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-primary leading-tight line-clamp-1">{item.title}</p>
                                                    <p className="text-[10px] text-primary/40 leading-tight line-clamp-1 mt-1">{item.description}</p>
                                                    <div className="flex flex-wrap gap-1 mt-1">
                                                        {item.tags.slice(0, 2).map((tag, idx) => (
                                                            <span key={idx} className="text-[9px] px-1.5 py-0.5 bg-primary/5 text-primary/60 rounded-full">
                                                                {tag}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="px-6 py-4 text-center">
                                            <Badge className={cn(
                                                "rounded-tl-sm rounded-br-sm rounded-tr-none rounded-bl-none font-bold text-[9px] uppercase tracking-widest border-none px-2 py-0.5",
                                                item.type === 'video' ? 'bg-purple-500 text-white' :
                                                    item.type === 'scorm' ? 'bg-accent text-white' :
                                                        'bg-primary text-white'
                                            )}>
                                                {getContentTypeLabel(item.type)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="px-6 py-4 text-center">
                                            <Badge className={cn(
                                                "rounded-tl-sm rounded-br-sm rounded-tr-none rounded-bl-none font-bold text-[9px] uppercase tracking-widest border-none px-2 py-0.5",
                                                item.status === 'published' ? 'bg-green-500 text-white' :
                                                    item.status === 'draft' ? 'bg-yellow-500 text-white' :
                                                        'bg-gray-500 text-white'
                                            )}>
                                                {item.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="px-6 py-4 text-center hidden md:table-cell">
                                            <span className="text-sm font-bold text-primary/80">{formatFileSize(item.fileSize)}</span>
                                        </TableCell>
                                        <TableCell className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button
                                                    asChild
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 shadow-none hover:bg-primary/5 rounded-tl-md rounded-br-md rounded-tr-none rounded-bl-none"
                                                >
                                                    <Link href={`/f/library/${item.id}`} className="flex items-center gap-2">
                                                        <Eye className="h-4 w-4 text-primary" />
                                                        View
                                                    </Link>
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 shadow-none hover:bg-accent/10 hover:text-accent rounded-tl-md rounded-br-md rounded-tr-none rounded-bl-none"
                                                    onClick={(e) => handleDelete(item.id, e)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>

                {/* Empty State */}
                {filteredContent.length === 0 && (
                    <div className="w-full bg-white shadow-lg border border-primary/10 overflow-hidden rounded-tl-2xl rounded-br-2xl rounded-tr-none rounded-bl-none p-20 text-center">
                        <Upload className="h-16 w-16 text-primary/10 mx-auto mb-4" />
                        <p className="text-primary/40 font-bold uppercase tracking-widest text-sm">No content found</p>
                        <p className="text-primary/30 text-xs mt-2 mb-6">Start by uploading learning materials</p>
                        <Button asChild className="bg-accent hover:bg-accent/90 text-white rounded-tl-md rounded-br-md rounded-tr-none rounded-bl-none font-bold">
                            <Link href="/f/library/upload">
                                <Plus className="h-4 w-4 mr-2" />
                                Upload Content
                            </Link>
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
