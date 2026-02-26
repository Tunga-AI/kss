'use client';
import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useUsersFirestore, useDoc } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import type { Organization } from '@/lib/organization-types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Building2, Save, ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

export default function BusinessSetupPage() {
    const router = useRouter();
    const { user: currentUser, loading: userLoading } = useUser();
    const firestore = useUsersFirestore();

    const orgRef = useMemo(() => {
        if (!firestore || !currentUser?.organizationId) return null;
        return doc(firestore, 'organizations', currentUser.organizationId);
    }, [firestore, currentUser]);

    const { data: org, loading: orgLoading } = useDoc<Organization>(orgRef as any);

    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState({
        industry: '',
        phone: '',
        website: '',
        address: '',
        city: '',
        country: '',
        description: '',
    });

    const loading = userLoading || orgLoading;

    // Load initial data once loaded
    useEffect(() => {
        if (org && !formData.industry && !formData.phone) {
            setFormData({
                industry: org.industry || '',
                phone: org.phone || '',
                website: org.website || '',
                address: org.address || '',
                city: org.city || '',
                country: org.country || '',
                description: org.description || '',
            });
        }
    }, [org]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!orgRef) return;

        setIsSaving(true);
        try {
            await updateDoc(orgRef, {
                ...formData,
                isSetupComplete: true,
            });
            toast({
                title: "Setup Complete",
                description: "Your organization profile is ready.",
            });
            router.push('/b');
        } catch (error) {
            console.error("Error updating organization:", error);
            toast({
                title: "Error",
                description: "Could not save profile details.",
                variant: 'destructive'
            });
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!currentUser || currentUser.role !== 'BusinessAdmin' || !org) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <p className="text-primary/50 text-sm font-bold">You don't have permission to access this page.</p>
            </div>
        );
    }

    return (
        <div className="w-full max-w-3xl mx-auto p-4 sm:p-6 lg:p-10 mb-20 drop-shadow-sm">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-headline font-bold text-primary flex items-center gap-2">
                        <Building2 className="h-8 w-8 text-accent" />
                        Complete Profile
                    </h1>
                    <p className="text-primary/60 mt-1">Set up your company details to get started.</p>
                </div>
                {org.isSetupComplete && (
                    <Button variant="outline" className="h-10 border-primary/20 text-primary rounded-tl-xl rounded-br-xl" onClick={() => router.push('/b')}>
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
                    </Button>
                )}
            </div>

            <Card className="border-primary/10 rounded-tl-3xl rounded-br-3xl shadow-lg">
                <CardHeader className="bg-primary/5 border-b border-primary/10 rounded-tl-3xl py-6 px-8">
                    <CardTitle className="text-xl font-bold text-primary">Organization Details</CardTitle>
                    <CardDescription>Tell us more about {org.name}</CardDescription>
                </CardHeader>
                <CardContent className="p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid sm:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-primary/60 uppercase tracking-widest">Industry</Label>
                                <Input
                                    name="industry"
                                    value={formData.industry}
                                    onChange={handleChange}
                                    placeholder="e.g. Technology, Retail"
                                    className="h-12 border-primary/10 focus:ring-primary rounded-tl-lg rounded-br-lg"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-primary/60 uppercase tracking-widest">Company Phone</Label>
                                <Input
                                    name="phone"
                                    type="tel"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    placeholder="+254 700 000 000"
                                    className="h-12 border-primary/10 focus:ring-primary rounded-tl-lg rounded-br-lg"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-primary/60 uppercase tracking-widest">Website</Label>
                            <Input
                                name="website"
                                type="url"
                                value={formData.website}
                                onChange={handleChange}
                                placeholder="https://www.yourcompany.com"
                                className="h-12 border-primary/10 focus:ring-primary rounded-tl-lg rounded-br-lg"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-primary/60 uppercase tracking-widest">Street Address</Label>
                            <Input
                                name="address"
                                value={formData.address}
                                onChange={handleChange}
                                placeholder="123 Business Park"
                                className="h-12 border-primary/10 focus:ring-primary rounded-tl-lg rounded-br-lg"
                            />
                        </div>

                        <div className="grid sm:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-primary/60 uppercase tracking-widest">City</Label>
                                <Input
                                    name="city"
                                    value={formData.city}
                                    onChange={handleChange}
                                    placeholder="Nairobi"
                                    className="h-12 border-primary/10 focus:ring-primary rounded-tl-lg rounded-br-lg"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-primary/60 uppercase tracking-widest">Country</Label>
                                <Input
                                    name="country"
                                    value={formData.country}
                                    onChange={handleChange}
                                    placeholder="Kenya"
                                    className="h-12 border-primary/10 focus:ring-primary rounded-tl-lg rounded-br-lg"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-primary/60 uppercase tracking-widest">Brief Description</Label>
                            <Textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                placeholder="What does your company do?"
                                className="min-h-[100px] border-primary/10 focus:ring-primary rounded-tl-lg rounded-br-lg"
                            />
                        </div>

                        <div className="pt-4 flex justify-end">
                            <Button
                                type="submit"
                                disabled={isSaving}
                                className="h-12 px-8 bg-accent hover:bg-accent/90 text-white font-bold rounded-tl-xl rounded-br-xl shadow-lg"
                            >
                                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                {isSaving ? 'Saving...' : (org.isSetupComplete ? 'Save Changes' : 'Complete Setup')}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
