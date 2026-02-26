'use client';
import { useState, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Search, FileText, Video, Package, Plus, X } from "lucide-react";
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import type { ContentItem } from '@/lib/content-library-types';
import { cn } from "@/lib/utils";

interface ContentSelectorProps {
    selectedContentIds?: string[];
    onSelectionChange: (contentIds: string[]) => void;
    trigger?: React.ReactNode;
    multiSelect?: boolean;
    filterByType?: string[];
}

export function ContentSelector({
    selectedContentIds = [],
    onSelectionChange,
    trigger,
    multiSelect = true,
    filterByType,
}: ContentSelectorProps) {
    const firestore = useFirestore();
    const [open, setOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selected, setSelected] = useState<string[]>(selectedContentIds);

    const contentQuery = useMemo(() => {
        if (!firestore) return null;
        let q = query(
            collection(firestore, 'contentLibrary'),
            where('status', '==', 'published'),
            orderBy('createdAt', 'desc')
        );
        return q;
    }, [firestore]);

    const { data: allContent, loading } = useCollection<ContentItem>(contentQuery as any);

    const filteredContent = useMemo(() => {
        if (!allContent) return [];
        return allContent.filter(item => {
            const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesType = !filterByType || filterByType.includes(item.type);
            return matchesSearch && matchesType;
        });
    }, [allContent, searchQuery, filterByType]);

    const handleToggle = (contentId: string) => {
        if (multiSelect) {
            setSelected(prev =>
                prev.includes(contentId)
                    ? prev.filter(id => id !== contentId)
                    : [...prev, contentId]
            );
        } else {
            setSelected([contentId]);
        }
    };

    const handleConfirm = () => {
        onSelectionChange(selected);
        setOpen(false);
    };

    const getContentIcon = (type: string) => {
        switch (type) {
            case 'video': return <Video className="h-4 w-4" />;
            case 'document': return <FileText className="h-4 w-4" />;
            case 'scorm': return <Package className="h-4 w-4" />;
            default: return <FileText className="h-4 w-4" />;
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="outline" className="rounded-tl-md rounded-br-md rounded-tr-none rounded-bl-none">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Content from Library
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden rounded-tl-3xl rounded-br-3xl rounded-tr-none rounded-bl-none">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold text-primary">Select Content from Library</DialogTitle>
                    <DialogDescription>
                        Choose learning materials to add to your course. {multiSelect ? 'You can select multiple items.' : 'Select one item.'}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/30" />
                        <Input
                            placeholder="Search content..."
                            className="pl-10 rounded-tl-lg rounded-br-lg rounded-tr-none rounded-bl-none"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    {/* Selected count */}
                    {selected.length > 0 && (
                        <div className="flex items-center justify-between p-3 bg-accent/10 rounded-tl-lg rounded-br-lg rounded-tr-none rounded-bl-none">
                            <span className="text-sm font-bold text-accent">
                                {selected.length} item{selected.length > 1 ? 's' : ''} selected
                            </span>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelected([])}
                                className="text-accent hover:text-accent/80"
                            >
                                Clear all
                            </Button>
                        </div>
                    )}

                    {/* Content List */}
                    <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                        {loading && (
                            <div className="text-center py-8 text-primary/40">Loading content...</div>
                        )}

                        {!loading && filteredContent.map((item) => {
                            const isSelected = selected.includes(item.id);
                            return (
                                <div
                                    key={item.id}
                                    onClick={() => handleToggle(item.id)}
                                    className={cn(
                                        "flex items-center gap-3 p-3 rounded-tl-lg rounded-br-lg rounded-tr-none rounded-bl-none border-2 cursor-pointer transition-all",
                                        isSelected
                                            ? "border-accent bg-accent/5"
                                            : "border-primary/10 hover:border-primary/30 hover:bg-primary/5"
                                    )}
                                >
                                    {multiSelect && (
                                        <Checkbox
                                            checked={isSelected}
                                            onCheckedChange={() => handleToggle(item.id)}
                                        />
                                    )}

                                    <div className="h-10 w-10 flex items-center justify-center rounded-tl-md rounded-br-md rounded-tr-none rounded-bl-none bg-primary/10 text-primary/40 flex-shrink-0">
                                        {getContentIcon(item.type)}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-primary text-sm truncate">{item.title}</h4>
                                        <p className="text-xs text-primary/60 truncate">{item.description}</p>
                                    </div>

                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        <Badge variant="outline" className="text-[10px]">
                                            {item.type}
                                        </Badge>
                                        {item.tags.slice(0, 1).map((tag, idx) => (
                                            <span key={idx} className="text-[10px] px-2 py-0.5 bg-primary/5 text-primary/60 rounded-full">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}

                        {!loading && filteredContent.length === 0 && (
                            <div className="text-center py-8 text-primary/40">
                                No content found. Try a different search.
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <Button
                            variant="outline"
                            onClick={() => setOpen(false)}
                            className="rounded-tl-md rounded-br-md rounded-tr-none rounded-bl-none"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleConfirm}
                            disabled={selected.length === 0}
                            className="bg-accent hover:bg-accent/90 text-white rounded-tl-md rounded-br-md rounded-tr-none rounded-bl-none"
                        >
                            Add {selected.length > 0 && `(${selected.length})`}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
