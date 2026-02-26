'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, RefreshCw, Search, ChevronDown, FileText, Video, Package, Folder, Edit, Trash2, Eye, Download, BarChart3, Upload, PenTool } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useUsersFirestore, useCollection } from '@/firebase';
import { collection, query, orderBy, where } from 'firebase/firestore';
import type { ContentItem, ContentFolder } from '@/lib/content-library-types';
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { format } from 'date-fns';

export default function AdminContentLibraryPage() {
    const firestore = useUsersFirestore();
    const [searchQuery, setSearchQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedFolder, setSelectedFolder] = useState<string | null>(null);

    const contentQuery = useMemo(() => {
        if (!firestore) return null;
        let q = query(collection(firestore, 'contentLibrary'), orderBy('createdAt', 'desc'));

        if (selectedFolder) {
            q = query(collection(firestore, 'contentLibrary'), where('folderId', '==', selectedFolder), orderBy('createdAt', 'desc'));
        }

        return q;
    }, [firestore, selectedFolder]);

    const foldersQuery = useMemo(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'contentFolders'), orderBy('name', 'asc'));
    }, [firestore]);

    const { data: allContent, loading: contentLoading } = useCollection<ContentItem>(contentQuery as any);
    const { data: folders } = useCollection<ContentFolder>(foldersQuery as any);

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

    const handleDelete = (id: string) => {
        if (firestore && confirm('Are you sure you want to delete this content?')) {
            // deleteContent(firestore, id);
            console.log('Delete content:', id);
        }
    };

    const getContentIcon = (type: string) => {
        switch (type) {
            case 'video': return <Video className="h-5 w-5" />;
            case 'document': return <FileText className="h-5 w-5" />;
            case 'scorm': return <Package className="h-5 w-5" />;
            default: return <FileText className="h-5 w-5" />;
        }
    };

    const getContentTypeLabel = (type: string) => {
        const labels: Record<string, string> = {
            video: 'Video',
            document: 'Document',
            scorm: 'SCORM Package',
            h5p: 'H5P Interactive',
            xapi: 'xAPI Content',
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

    if (contentLoading) {
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
                            <p className="text-white/80 text-lg font-medium">Manage all learning materials, videos, documents and SCORM packages</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <Button
                                variant="outline"
                                className="border-white text-white hover:bg-white hover:text-primary h-12 px-6 rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none font-bold transition-all"
                                asChild
                            >
                                <Link href="/a/library/analytics">
                                    <BarChart3 className="h-4 w-4 mr-2" />
                                    Analytics
                                </Link>
                            </Button>

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button className="bg-secondary hover:bg-secondary/90 text-white border-none h-12 px-6 rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none font-bold shadow-lg transition-all">
                                        <Plus className="h-4 w-4 mr-2" />
                                        Add Content
                                        <ChevronDown className="h-4 w-4 ml-2 opacity-50" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56">
                                    <DropdownMenuItem asChild>
                                        <Link href="/a/library/upload" className="cursor-pointer">
                                            <Upload className="h-4 w-4 mr-2" />
                                            <span>Upload Material</span>
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                        <Link href="/a/library/create" className="cursor-pointer">
                                            <PenTool className="h-4 w-4 mr-2" />
                                            <span>Create Course</span>
                                        </Link>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
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
                                placeholder="Search by title or description..."
                                className="pl-12 h-14 bg-white border-primary/10 rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none focus:ring-primary focus:border-primary shadow-sm text-base font-medium"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-4 items-end w-full lg:w-auto">
                        <DropdownCard
                            label="Content Type"
                            value={typeFilter}
                            onChange={(val: string) => setTypeFilter(val)}
                            options={[
                                { value: 'all', label: 'All Types' },
                                { value: 'video', label: 'Videos' },
                                { value: 'document', label: 'Documents' },
                                { value: 'scorm', label: 'SCORM Packages' },
                                { value: 'h5p', label: 'H5P Interactive' },
                            ]}
                            className="w-full sm:w-64"
                        />
                        <DropdownCard
                            label="Status"
                            value={statusFilter}
                            onChange={(val: string) => setStatusFilter(val)}
                            options={[
                                { value: 'all', label: 'All Status' },
                                { value: 'published', label: 'Published' },
                                { value: 'draft', label: 'Draft' },
                                { value: 'archived', label: 'Archived' }
                            ]}
                            className="w-full sm:w-64"
                        />
                    </div>
                </div>

                {/* Folder Navigation */}
                {folders && folders.length > 0 && (
                    <div className="mb-6 flex gap-2 flex-wrap">
                        <Button
                            variant={selectedFolder === null ? "default" : "outline"}
                            onClick={() => setSelectedFolder(null)}
                            className="rounded-tl-md rounded-br-md rounded-tr-none rounded-bl-none"
                        >
                            <Folder className="h-4 w-4 mr-2" />
                            All Content
                        </Button>
                        {folders.map(folder => (
                            <Button
                                key={folder.id}
                                variant={selectedFolder === folder.id ? "default" : "outline"}
                                onClick={() => setSelectedFolder(folder.id)}
                                className="rounded-tl-md rounded-br-md rounded-tr-none rounded-bl-none"
                            >
                                <Folder className="h-4 w-4 mr-2" />
                                {folder.name}
                            </Button>
                        ))}
                    </div>
                )}

                {/* Content Table */}
                <div className="w-full bg-white shadow-lg border border-primary/10 overflow-hidden rounded-tl-2xl rounded-br-2xl rounded-tr-none rounded-bl-none">
                    <div className="overflow-x-auto">
                        <Table className="w-full">
                            <TableHeader className="bg-primary/5 border-b border-primary/10">
                                <TableRow className="hover:bg-transparent">
                                    <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest">Content</TableHead>
                                    <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest text-center">Type</TableHead>
                                    <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest text-center">Size</TableHead>
                                    <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest text-center">Status</TableHead>
                                    <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest">Created</TableHead>
                                    <TableHead className="px-6 py-4 font-bold text-primary text-[10px] uppercase tracking-widest text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody className="divide-y divide-primary/10">
                                {filteredContent.map((item) => (
                                    <TableRow key={item.id} className="hover:bg-primary/5 cursor-pointer transition-colors group border-primary/10">
                                        <TableCell className="px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 flex items-center justify-center rounded-tl-lg rounded-br-lg bg-primary/10 text-primary/40 group-hover:bg-accent group-hover:text-white transition-all">
                                                    {getContentIcon(item.type)}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-primary leading-tight">{item.title}</p>
                                                    <p className="text-[10px] text-primary/40 uppercase font-black mt-1">{item.fileName}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="px-6 py-4 text-center">
                                            <span className={cn(
                                                "inline-flex text-[9px] font-bold uppercase px-2 py-0.5 rounded-tl-sm rounded-br-sm rounded-tr-none rounded-bl-none",
                                                item.type === 'scorm' ? 'bg-accent/10 text-accent' :
                                                    item.type === 'video' ? 'bg-purple-500/10 text-purple-600' :
                                                        'bg-primary/10 text-primary'
                                            )}>
                                                {getContentTypeLabel(item.type)}
                                            </span>
                                        </TableCell>
                                        <TableCell className="px-6 py-4 text-center">
                                            <span className="text-sm font-bold text-primary/80">{formatFileSize(item.fileSize)}</span>
                                        </TableCell>
                                        <TableCell className="px-6 py-4 text-center">
                                            <Badge className={cn(
                                                "rounded-tl-sm rounded-br-sm rounded-tr-none rounded-bl-none font-bold text-[9px] uppercase tracking-widest border-none px-3",
                                                item.status === 'published' ? 'bg-green-500 text-white' :
                                                    item.status === 'draft' ? 'bg-primary/20 text-primary/60' :
                                                        'bg-primary/40 text-white'
                                            )}>
                                                {item.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="px-6 py-4">
                                            <div className="text-xs text-primary/70">
                                                {item.createdAt ? format(item.createdAt.toDate(), 'MMM d, yyyy') : 'N/A'}
                                            </div>
                                        </TableCell>
                                        <TableCell className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2  transition-opacity">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    asChild
                                                    className="h-8 shadow-none hover:bg-green-500 hover:text-white rounded-tl-md rounded-br-md rounded-tr-none rounded-bl-none"
                                                >
                                                    <Link href={`/a/library/${item.id}`}>
                                                        <Eye className="h-4 w-4" />
                                                    </Link>
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    asChild
                                                    className="h-8 shadow-none hover:bg-primary/5 rounded-tl-md rounded-br-md rounded-tr-none rounded-bl-none"
                                                >
                                                    <Link href={(item as any).type === 'course' ? `/a/library/create?id=${item.id}` : `/a/library/${item.id}/edit`}>
                                                        <Edit className="h-4 w-4 text-primary" />
                                                    </Link>
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 shadow-none hover:bg-accent/10 hover:text-accent rounded-tl-md rounded-br-md rounded-tr-none rounded-bl-none"
                                                    onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {filteredContent.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-20 text-primary/40 font-bold uppercase tracking-widest">
                                            No content found in library
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
