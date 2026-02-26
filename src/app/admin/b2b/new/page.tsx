'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    ArrowLeft, Building, User, Mail, Lock, Users,
    Calendar, Shield, Briefcase, Loader2, Save
} from 'lucide-react';
import { createBusinessManually } from '@/app/actions/create-business';
import { toast } from '@/components/ui/use-toast';

const TIERS = ['Startup', 'SME', 'Corporate'] as const;
const STATUSES = ['Trial', 'Active'] as const;
const PERIODS = [
    { value: 1, label: '1 Month' },
    { value: 3, label: '3 Months' },
    { value: 6, label: '6 Months' },
    { value: 12, label: '12 Months' },
    { value: 24, label: '24 Months' },
];

export default function NewBusinessPage() {
    const router = useRouter();
    const [isSaving, setIsSaving] = useState(false);

    const [companyName, setCompanyName] = useState('');
    const [adminName, setAdminName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [tier, setTier] = useState<typeof TIERS[number]>('Startup');
    const [maxLearners, setMaxLearners] = useState(10);
    const [period, setPeriod] = useState(12);
    const [status, setStatus] = useState<typeof STATUSES[number]>('Trial');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        const result = await createBusinessManually({
            companyName,
            adminName,
            email,
            password,
            tier,
            maxLearners,
            period,
            status,
        });

        setIsSaving(false);

        if (result.success) {
            toast({ title: 'Business Created', description: `${companyName} has been set up successfully.` });
            router.push(result.orgId ? `/a/b2b/${result.orgId}` : '/a/b2b');
        } else {
            toast({ title: 'Error', description: result.error, variant: 'destructive' });
        }
    };

    return (
        <div className="w-full min-h-screen bg-gray-50/50 p-2 md:p-4 font-body">
            <div className="w-full max-w-3xl mx-auto">

                {/* Hero */}
                <div className="bg-primary text-white p-6 md:p-10 mb-6 rounded-tl-3xl rounded-br-3xl shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-accent/20 rounded-full blur-3xl opacity-20" />
                    <div className="relative z-10 flex items-center justify-between gap-6">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <Briefcase className="h-8 w-8 bg-accent/20 p-1.5 rounded-lg text-accent" />
                                <h1 className="text-3xl font-bold tracking-tight">Create Business</h1>
                            </div>
                            <p className="text-white/70 font-medium">Manually onboard a new corporate client</p>
                        </div>
                        <Button
                            variant="outline"
                            className="h-12 border-white/20 text-white hover:bg-white hover:text-primary px-6 rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none shrink-0"
                            onClick={() => router.back()}
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" /> Back
                        </Button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">

                    {/* Company Info */}
                    <Card className="border border-primary/10 shadow-lg rounded-tl-2xl rounded-br-2xl rounded-tr-none rounded-bl-none">
                        <CardHeader className="bg-primary/5 border-b border-primary/10">
                            <CardTitle className="text-base font-bold text-primary flex items-center gap-2">
                                <Building className="h-4 w-4 text-accent" /> Company Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-5">
                            <div className="space-y-2">
                                <Label htmlFor="companyName" className="text-xs font-bold text-primary/60 uppercase tracking-widest">Company Name *</Label>
                                <Input
                                    id="companyName"
                                    required
                                    value={companyName}
                                    onChange={(e) => setCompanyName(e.target.value)}
                                    placeholder="Acme Corporation"
                                    className="h-12 border-primary/10 rounded-tl-lg rounded-br-lg rounded-tr-none rounded-bl-none focus:ring-primary"
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <div className="space-y-2">
                                    <Label htmlFor="tier" className="text-xs font-bold text-primary/60 uppercase tracking-widest">Service Tier *</Label>
                                    <select
                                        id="tier"
                                        value={tier}
                                        onChange={(e) => setTier(e.target.value as typeof tier)}
                                        className="w-full h-12 appearance-none bg-white border border-primary/10 rounded-tl-lg rounded-br-lg rounded-tr-none rounded-bl-none px-4 text-sm font-bold text-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
                                    >
                                        {TIERS.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="status" className="text-xs font-bold text-primary/60 uppercase tracking-widest">Initial Status *</Label>
                                    <select
                                        id="status"
                                        value={status}
                                        onChange={(e) => setStatus(e.target.value as typeof status)}
                                        className="w-full h-12 appearance-none bg-white border border-primary/10 rounded-tl-lg rounded-br-lg rounded-tr-none rounded-bl-none px-4 text-sm font-bold text-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
                                    >
                                        {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <div className="space-y-2">
                                    <Label htmlFor="maxLearners" className="text-xs font-bold text-primary/60 uppercase tracking-widest">
                                        <Users className="inline h-3 w-3 mr-1" /> Max Learner Seats *
                                    </Label>
                                    <Input
                                        id="maxLearners"
                                        type="number"
                                        min={1}
                                        required
                                        value={maxLearners}
                                        onChange={(e) => setMaxLearners(parseInt(e.target.value) || 1)}
                                        className="h-12 border-primary/10 rounded-tl-lg rounded-br-lg rounded-tr-none rounded-bl-none focus:ring-primary"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="period" className="text-xs font-bold text-primary/60 uppercase tracking-widest">
                                        <Calendar className="inline h-3 w-3 mr-1" /> Subscription Period *
                                    </Label>
                                    <select
                                        id="period"
                                        value={period}
                                        onChange={(e) => setPeriod(parseInt(e.target.value))}
                                        className="w-full h-12 appearance-none bg-white border border-primary/10 rounded-tl-lg rounded-br-lg rounded-tr-none rounded-bl-none px-4 text-sm font-bold text-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
                                    >
                                        {PERIODS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                                    </select>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Admin Account */}
                    <Card className="border border-primary/10 shadow-lg rounded-tl-2xl rounded-br-2xl rounded-tr-none rounded-bl-none">
                        <CardHeader className="bg-primary/5 border-b border-primary/10">
                            <CardTitle className="text-base font-bold text-primary flex items-center gap-2">
                                <Shield className="h-4 w-4 text-accent" /> Business Admin Account
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-5">
                            <div className="space-y-2">
                                <Label htmlFor="adminName" className="text-xs font-bold text-primary/60 uppercase tracking-widest">
                                    <User className="inline h-3 w-3 mr-1" /> Full Name *
                                </Label>
                                <Input
                                    id="adminName"
                                    required
                                    value={adminName}
                                    onChange={(e) => setAdminName(e.target.value)}
                                    placeholder="Jane Doe"
                                    className="h-12 border-primary/10 rounded-tl-lg rounded-br-lg rounded-tr-none rounded-bl-none focus:ring-primary"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-xs font-bold text-primary/60 uppercase tracking-widest">
                                    <Mail className="inline h-3 w-3 mr-1" /> Email Address *
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="admin@company.com"
                                    className="h-12 border-primary/10 rounded-tl-lg rounded-br-lg rounded-tr-none rounded-bl-none focus:ring-primary"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-xs font-bold text-primary/60 uppercase tracking-widest">
                                    <Lock className="inline h-3 w-3 mr-1" /> Password *
                                </Label>
                                <Input
                                    id="password"
                                    type="password"
                                    required
                                    minLength={6}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Min. 6 characters"
                                    className="h-12 border-primary/10 rounded-tl-lg rounded-br-lg rounded-tr-none rounded-bl-none focus:ring-primary"
                                />
                                <p className="text-[10px] text-primary/40 font-medium">
                                    Share these credentials with the business admin. They can change their password after logging in.
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Submit */}
                    <div className="flex justify-end gap-4 pb-8">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.back()}
                            disabled={isSaving}
                            className="h-12 px-8 border-primary/20 rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none font-bold"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSaving}
                            className="h-12 px-8 bg-accent hover:bg-accent/90 text-white rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none font-bold shadow-lg"
                        >
                            {isSaving
                                ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Creating...</>
                                : <><Save className="h-4 w-4 mr-2" /> Create Business</>
                            }
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
