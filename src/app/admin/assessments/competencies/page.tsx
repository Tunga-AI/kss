'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUsersFirestore } from '@/firebase';
import { getCompetencyConfig, saveCompetencyConfig, getDefaultCompetencies } from '@/lib/competencies';
import type { CompetencyCategory, Competency } from '@/lib/assessment-types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
    ArrowLeft, Save, Settings2, Plus, Trash2, ChevronDown, ChevronRight,
    RefreshCw, Tag, Layers, BookOpen
} from 'lucide-react';

function generateId(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') + '-' + Math.random().toString(36).substring(2, 5);
}

export default function CompetencySettingsPage() {
    const router = useRouter();
    const usersFirestore = useUsersFirestore();
    const [categories, setCategories] = useState<CompetencyCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (!usersFirestore) return;
        (async () => {
            const config = await getCompetencyConfig(usersFirestore);
            if (config && config.categories.length > 0) {
                setCategories(config.categories);
            } else {
                setCategories(getDefaultCompetencies());
            }
            setLoading(false);
        })();
    }, [usersFirestore]);

    const handleSave = async () => {
        if (!usersFirestore) return;
        setSaving(true);
        try {
            await saveCompetencyConfig(usersFirestore, categories);
            alert('Competency configuration saved.');
        } catch (e) {
            console.error(e);
            alert('Failed to save configuration.');
        } finally {
            setSaving(false);
        }
    };

    const toggleCategory = (id: string) => {
        setExpandedCategories(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    // Category CRUD
    const updateCategoryField = (catIdx: number, field: keyof CompetencyCategory, value: string) => {
        setCategories(prev => {
            const next = [...prev];
            next[catIdx] = { ...next[catIdx], [field]: value };
            return next;
        });
    };

    const addCategory = () => {
        const newCat: CompetencyCategory = {
            id: generateId('new-category'),
            name: 'New Category',
            description: '',
            competencies: [],
        };
        setCategories(prev => [...prev, newCat]);
        setExpandedCategories(prev => new Set([...prev, newCat.id]));
    };

    const removeCategory = (catIdx: number) => {
        if (!confirm('Remove this category and all its competencies?')) return;
        setCategories(prev => prev.filter((_, i) => i !== catIdx));
    };

    // Competency CRUD
    const addCompetency = (catIdx: number) => {
        setCategories(prev => {
            const next = [...prev];
            const newComp: Competency = {
                id: generateId('new-competency'),
                name: '',
                description: '',
            };
            next[catIdx] = {
                ...next[catIdx],
                competencies: [...next[catIdx].competencies, newComp],
            };
            return next;
        });
    };

    const updateCompetency = (catIdx: number, compIdx: number, field: keyof Competency, value: string) => {
        setCategories(prev => {
            const next = [...prev];
            const comps = [...next[catIdx].competencies];
            comps[compIdx] = { ...comps[compIdx], [field]: value };
            next[catIdx] = { ...next[catIdx], competencies: comps };
            return next;
        });
    };

    const removeCompetency = (catIdx: number, compIdx: number) => {
        setCategories(prev => {
            const next = [...prev];
            next[catIdx] = {
                ...next[catIdx],
                competencies: next[catIdx].competencies.filter((_, i) => i !== compIdx),
            };
            return next;
        });
    };

    if (loading) {
        return (
            <div className="p-8 flex items-center justify-center min-h-screen">
                <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    const totalCompetencies = categories.reduce((sum, c) => sum + c.competencies.length, 0);

    return (
        <div className="w-full min-h-screen bg-gray-50/50 p-2 md:p-4 font-body pb-20">
            <div className="w-full max-w-[1200px] mx-auto">

                {/* Hero Header */}
                <div className="bg-primary text-white p-6 md:p-10 mb-6 rounded-tl-3xl rounded-br-3xl rounded-tr-none rounded-bl-none shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-accent/20 rounded-full blur-3xl opacity-20" />
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div className="flex items-center gap-5">
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-12 w-12 border-white/20 text-white hover:bg-white hover:text-primary rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none"
                                onClick={() => router.back()}
                            >
                                <ArrowLeft className="h-6 w-6" />
                            </Button>
                            <div>
                                <div className="flex items-center gap-3 mb-1">
                                    <Settings2 className="h-5 w-5 text-accent" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Assessment Settings</span>
                                </div>
                                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Key Competencies</h1>
                                <p className="text-white/60 mt-1 text-sm">
                                    {categories.length} categories &middot; {totalCompetencies} competencies
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Button
                                onClick={addCategory}
                                variant="outline"
                                className="border-white/30 text-white hover:bg-white hover:text-primary h-12 px-5 rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none font-bold"
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Add Category
                            </Button>
                            <Button
                                onClick={handleSave}
                                disabled={saving}
                                className="bg-accent hover:bg-accent/90 text-white h-12 px-6 rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none font-bold shadow-lg"
                            >
                                {saving ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                                {saving ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Info Banner */}
                <div className="bg-accent/10 border border-accent/20 rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none p-4 mb-6 flex items-start gap-3">
                    <BookOpen className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-primary/80">
                        These competencies are used when creating assessments. Each assessment can be tagged with relevant competency categories, and each question can be linked to a specific competency. Changes here are reflected immediately when creating new assessments.
                    </p>
                </div>

                {/* Categories */}
                <div className="space-y-4">
                    {categories.map((cat, catIdx) => {
                        const isExpanded = expandedCategories.has(cat.id);
                        return (
                            <Card key={cat.id} className="bg-white border border-primary/10 rounded-tl-2xl rounded-br-2xl rounded-tr-none rounded-bl-none shadow-lg overflow-hidden">
                                {/* Category Header */}
                                <div className="p-5 flex items-center gap-4">
                                    <button
                                        type="button"
                                        onClick={() => toggleCategory(cat.id)}
                                        className="h-9 w-9 flex items-center justify-center rounded-tl-lg rounded-br-lg bg-primary/5 hover:bg-primary/10 text-primary flex-shrink-0 transition-colors"
                                    >
                                        {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                    </button>
                                    <div className="flex-1 min-w-0">
                                        <Input
                                            value={cat.name}
                                            onChange={(e) => updateCategoryField(catIdx, 'name', e.target.value)}
                                            className="font-bold text-primary text-base border-none bg-transparent px-0 h-7 focus-visible:ring-0 focus-visible:ring-offset-0"
                                            placeholder="Category name"
                                        />
                                        <p className="text-[10px] text-primary/40 uppercase tracking-widest mt-0.5">
                                            {cat.competencies.length} competenc{cat.competencies.length === 1 ? 'y' : 'ies'}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        <span className="hidden sm:flex items-center gap-1.5 bg-primary/5 px-3 py-1 rounded-tl-md rounded-br-md text-[10px] font-black uppercase tracking-wider text-primary/40">
                                            <Tag className="h-3 w-3" />
                                            {cat.id}
                                        </span>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => removeCategory(catIdx)}
                                            className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-500 text-primary/20 rounded-full"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>

                                {/* Expanded Content */}
                                {isExpanded && (
                                    <div className="border-t border-primary/10 p-5 bg-gray-50/50">
                                        {/* Category description */}
                                        <div className="mb-5">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-primary/40 ml-1">Category Description</Label>
                                            <Textarea
                                                value={cat.description}
                                                onChange={(e) => updateCategoryField(catIdx, 'description', e.target.value)}
                                                rows={2}
                                                className="mt-1.5 bg-white border-primary/10 rounded-tl-lg rounded-br-lg rounded-tr-none rounded-bl-none text-sm"
                                                placeholder="Describe what this category covers..."
                                            />
                                        </div>

                                        {/* Competencies list */}
                                        <div className="space-y-3">
                                            {cat.competencies.map((comp, compIdx) => (
                                                <div key={comp.id} className="bg-white rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none border border-primary/10 p-4 flex gap-4 items-start">
                                                    <div className="h-7 w-7 rounded-tl-md rounded-br-md bg-accent/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                                                        <Layers className="h-3.5 w-3.5 text-accent" />
                                                    </div>
                                                    <div className="flex-1 space-y-2">
                                                        <Input
                                                            value={comp.name}
                                                            onChange={(e) => updateCompetency(catIdx, compIdx, 'name', e.target.value)}
                                                            className="font-bold text-primary border-none bg-transparent px-0 h-7 focus-visible:ring-0 focus-visible:ring-offset-0"
                                                            placeholder="Competency name"
                                                        />
                                                        <Input
                                                            value={comp.description}
                                                            onChange={(e) => updateCompetency(catIdx, compIdx, 'description', e.target.value)}
                                                            className="text-sm text-primary/70 border-none bg-transparent px-0 h-6 focus-visible:ring-0 focus-visible:ring-offset-0"
                                                            placeholder="Description..."
                                                        />
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => removeCompetency(catIdx, compIdx)}
                                                        className="h-7 w-7 p-0 hover:bg-red-50 hover:text-red-500 text-primary/20 rounded-full flex-shrink-0 mt-0.5"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            ))}

                                            <Button
                                                type="button"
                                                variant="ghost"
                                                onClick={() => addCompetency(catIdx)}
                                                className="w-full h-10 border border-dashed border-primary/20 hover:border-primary/40 hover:bg-primary/5 text-primary/50 hover:text-primary text-sm font-bold rounded-tl-lg rounded-br-lg rounded-tr-none rounded-bl-none"
                                            >
                                                <Plus className="h-4 w-4 mr-2" />
                                                Add Competency
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </Card>
                        );
                    })}
                </div>

                {categories.length === 0 && (
                    <div className="text-center py-20">
                        <Settings2 className="h-12 w-12 text-primary/20 mx-auto mb-4" />
                        <p className="text-primary/40 font-bold uppercase tracking-widest text-sm">No competency categories</p>
                        <Button onClick={addCategory} className="mt-4 bg-accent text-white rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none font-bold">
                            <Plus className="h-4 w-4 mr-2" />
                            Add First Category
                        </Button>
                    </div>
                )}

                {/* Floating Save */}
                {categories.length > 3 && (
                    <div className="fixed bottom-6 right-6 z-50">
                        <Button
                            onClick={handleSave}
                            disabled={saving}
                            className="bg-accent hover:bg-accent/90 text-white h-14 px-8 rounded-tl-2xl rounded-br-2xl rounded-tr-none rounded-bl-none font-bold shadow-2xl"
                        >
                            {saving ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                            {saving ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
