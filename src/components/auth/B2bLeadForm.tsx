'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, CheckCircle2, Send, Building2, User, Mail, Phone, Users } from 'lucide-react';
import { useFirestore } from '@/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { allocateLeadToSalesStaff } from '@/lib/sales';

const tierOptions = ['Startup (Up to 5 users)', 'SME (Up to 20 users)', 'Corporate (21+ users)', 'Not sure yet'];

export function B2bLeadForm() {
    const firestore = useFirestore();
    const [formData, setFormData] = useState({
        companyName: '',
        name: '',
        email: '',
        phone: '',
        numLearners: '',
        interestedTier: '',
        message: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showSuccess, setShowSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.companyName || !formData.name || !formData.email) {
            setError('Please fill in Company Name, Full Name, and Email.');
            return;
        }
        if (!firestore) return;

        setLoading(true);
        setError(null);

        try {
            const assignedStaffId = await allocateLeadToSalesStaff(firestore);
            await addDoc(collection(firestore, 'sales'), {
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
                program: `B2B Enquiry - ${formData.companyName}`,
                programType: 'B2B',
                numLearners: formData.numLearners ? parseInt(formData.numLearners, 10) : null,
                status: 'Prospect',
                createdAt: serverTimestamp(),
                assignedTo: assignedStaffId || null,
                details: {
                    companyName: formData.companyName,
                    interestedTier: formData.interestedTier,
                    message: formData.message,
                    source: 'for-business-page',
                }
            });
            setShowSuccess(true);
        } catch (err) {
            console.error('Error saving lead:', err);
            setError('Failed to submit. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const updateField = (field: string, value: string) =>
        setFormData(prev => ({ ...prev, [field]: value }));

    return (
        <>
            <Card className="w-full border-0 shadow-none">
                <CardHeader className="pb-4">
                    <CardTitle className="font-headline text-2xl text-primary">Show Your Interest</CardTitle>
                    <CardDescription className="text-primary/60">Our team will reach out within 24 hours with a personalized proposal.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="grid gap-4">
                        <div className="grid gap-1.5">
                            <Label htmlFor="companyName" className="text-xs font-bold text-primary/60 uppercase tracking-widest flex items-center gap-1">
                                <Building2 className="h-3 w-3" /> Company Name *
                            </Label>
                            <Input
                                id="companyName"
                                placeholder="Acme Corporation"
                                value={formData.companyName}
                                onChange={e => updateField('companyName', e.target.value)}
                                required
                                disabled={loading}
                                className="h-11 border-primary/20 rounded-tl-lg rounded-br-lg rounded-tr-sm rounded-bl-sm focus:border-accent focus:ring-accent"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="grid gap-1.5">
                                <Label htmlFor="leadName" className="text-xs font-bold text-primary/60 uppercase tracking-widest flex items-center gap-1">
                                    <User className="h-3 w-3" /> Your Name *
                                </Label>
                                <Input
                                    id="leadName"
                                    placeholder="Jane Mwangi"
                                    value={formData.name}
                                    onChange={e => updateField('name', e.target.value)}
                                    required
                                    disabled={loading}
                                    className="h-11 border-primary/20 rounded-tl-lg rounded-br-lg rounded-tr-sm rounded-bl-sm focus:border-accent focus:ring-accent"
                                />
                            </div>
                            <div className="grid gap-1.5">
                                <Label htmlFor="leadPhone" className="text-xs font-bold text-primary/60 uppercase tracking-widest flex items-center gap-1">
                                    <Phone className="h-3 w-3" /> Phone
                                </Label>
                                <Input
                                    id="leadPhone"
                                    placeholder="+254 700 000 000"
                                    value={formData.phone}
                                    onChange={e => updateField('phone', e.target.value)}
                                    disabled={loading}
                                    className="h-11 border-primary/20 rounded-tl-lg rounded-br-lg rounded-tr-sm rounded-bl-sm focus:border-accent focus:ring-accent"
                                />
                            </div>
                        </div>

                        <div className="grid gap-1.5">
                            <Label htmlFor="leadEmail" className="text-xs font-bold text-primary/60 uppercase tracking-widest flex items-center gap-1">
                                <Mail className="h-3 w-3" /> Work Email *
                            </Label>
                            <Input
                                id="leadEmail"
                                type="email"
                                placeholder="jane@company.com"
                                value={formData.email}
                                onChange={e => updateField('email', e.target.value)}
                                required
                                disabled={loading}
                                className="h-11 border-primary/20 rounded-tl-lg rounded-br-lg rounded-tr-sm rounded-bl-sm focus:border-accent focus:ring-accent"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="grid gap-1.5">
                                <Label htmlFor="numLearners" className="text-xs font-bold text-primary/60 uppercase tracking-widest flex items-center gap-1">
                                    <Users className="h-3 w-3" /> Team Size
                                </Label>
                                <Input
                                    id="numLearners"
                                    type="number"
                                    min="1"
                                    placeholder="e.g. 15"
                                    value={formData.numLearners}
                                    onChange={e => updateField('numLearners', e.target.value)}
                                    disabled={loading}
                                    className="h-11 border-primary/20 rounded-tl-lg rounded-br-lg rounded-tr-sm rounded-bl-sm focus:border-accent focus:ring-accent"
                                />
                            </div>
                            <div className="grid gap-1.5">
                                <Label htmlFor="interestedTier" className="text-xs font-bold text-primary/60 uppercase tracking-widest">
                                    Interested Plan
                                </Label>
                                <select
                                    id="interestedTier"
                                    value={formData.interestedTier}
                                    onChange={e => updateField('interestedTier', e.target.value)}
                                    disabled={loading}
                                    className="h-11 border border-primary/20 rounded-tl-lg rounded-br-lg rounded-tr-sm rounded-bl-sm px-3 text-sm text-primary bg-white focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
                                >
                                    <option value="">Select plan...</option>
                                    {tierOptions.map(t => (
                                        <option key={t} value={t}>{t}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {error && (
                            <Alert variant="destructive" className="py-2">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        <div className="flex flex-col gap-3 pt-2">
                            <Button
                                type="submit"
                                disabled={loading}
                                className="w-full h-12 rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none bg-primary hover:bg-primary/90 text-white font-bold"
                            >
                                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                                {loading ? 'Submitting...' : 'Send My Interest'}
                            </Button>
                            <p className="text-center text-xs text-primary/50">
                                Ready to get started immediately?{' '}
                                <Link href="#pricing" className="text-accent font-bold hover:underline">
                                    View pricing plans
                                </Link>
                            </p>
                        </div>
                    </form>
                </CardContent>
            </Card>

            <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
                <DialogContent className="sm:max-w-md bg-white border-0 shadow-2xl rounded-tl-3xl rounded-br-3xl rounded-tr-sm rounded-bl-sm">
                    <DialogHeader className="flex flex-col items-center text-center space-y-4 pt-6">
                        <div className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center">
                            <CheckCircle2 className="h-10 w-10 text-green-600" />
                        </div>
                        <DialogTitle className="text-2xl font-bold text-primary font-headline">Interest Registered!</DialogTitle>
                        <DialogDescription className="text-center text-base font-medium text-gray-600">
                            Thank you for your interest! Our corporate team will be in touch within 24 hours with a tailored proposal for <strong>{formData.companyName}</strong>.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="flex flex-col sm:flex-row gap-3 pt-6 pb-2 w-full px-6">
                        <Button
                            className="w-full h-12 font-bold bg-primary hover:bg-primary/90 text-white rounded-tl-xl rounded-br-xl rounded-tr-sm rounded-bl-sm"
                            onClick={() => setShowSuccess(false)}
                        >
                            Close
                        </Button>
                        <Button
                            variant="outline"
                            className="w-full h-12 font-bold text-primary/70 hover:text-primary rounded-tl-xl rounded-br-xl rounded-tr-sm rounded-bl-sm border-primary/20"
                            asChild
                        >
                            <Link href="#pricing">View Plans</Link>
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
