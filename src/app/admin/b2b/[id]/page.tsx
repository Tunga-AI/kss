'use client';
import { useMemo } from 'react';
import { useParams, notFound, useRouter } from 'next/navigation';
import { useUsersFirestore, useDoc } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { Organization } from '@/lib/organization-types';
import type { User } from '@/lib/user-types';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    ArrowLeft,
    Building,
    Mail,
    Calendar,
    Shield,
    Users,
    Activity,
    RefreshCw,
    Settings2,
    Briefcase,
    Globe,
    CreditCard
} from 'lucide-react';
import { updateOrganizationStatus } from '@/app/actions/organizations';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { cn } from "@/lib/utils";

export default function OrganizationDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const id = Array.isArray(params.id) ? params.id[0] : params.id;
    const firestore = useUsersFirestore();

    const orgRef = useMemo(() => {
        if (!firestore || !id) return null;
        return doc(firestore, 'organizations', id);
    }, [firestore, id]);

    const { data: organization, loading: orgLoading } = useDoc<Organization>(orgRef as any);

    const adminQuery = useMemo(() => {
        if (!firestore || !organization?.adminId) return null;
        return doc(firestore, 'users', organization.adminId);
    }, [firestore, organization]);

    const { data: adminUser, loading: adminLoading } = useDoc<User>(adminQuery as any);

    const handleStatusChange = async (newStatus: Organization['status']) => {
        if (!id) return;
        const result = await updateOrganizationStatus(id, newStatus);
        if (result.success) {
            toast({ title: "Status Updated", description: "The organization's status has been successfully updated." });
        } else {
            toast({ variant: "destructive", title: "Update Failed", description: result.error });
        }
    };

    const loading = orgLoading || adminLoading;

    if (loading) {
        return (
            <div className="p-8 flex items-center justify-center min-h-screen">
                <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!organization) {
        notFound();
    }

    return (
        <div className="w-full min-h-screen bg-gray-50/50 p-2 md:p-4 font-body">
            <div className="w-full max-w-6xl mx-auto">
                {/* Hero Header Section */}
                <div className="bg-primary text-white p-6 md:p-10 mb-6 border-b border-primary/10 rounded-tl-3xl rounded-br-3xl rounded-tr-none rounded-bl-none shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-accent/20 rounded-full blur-3xl opacity-20" />

                    <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                        <div className="h-24 w-24 md:h-32 md:w-32 rounded-tl-3xl rounded-br-3xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
                            <Building className="h-12 w-12 text-accent" />
                        </div>

                        <div className="text-center md:text-left flex-1">
                            <div className="flex flex-col md:flex-row md:items-center gap-3 mb-2">
                                <h1 className="text-3xl md:text-5xl font-bold tracking-tight">{organization.name}</h1>
                                <Badge className={cn(
                                    "w-fit mx-auto md:mx-0 font-black text-[10px] uppercase tracking-widest px-3 py-1 rounded-tl-md rounded-br-md rounded-tr-none rounded-bl-none shadow-lg border-none",
                                    organization.status === 'Active' ? 'bg-green-500 text-white' :
                                        organization.status === 'Trial' ? 'bg-accent text-white' :
                                            'bg-primary/40 text-white/50'
                                )}>
                                    {organization.status} Status
                                </Badge>
                            </div>
                            <p className="text-white/60 text-lg flex items-center justify-center md:justify-start gap-2">
                                <Globe className="h-4 w-4" /> Enterprise Workspace ID: {id?.substring(0, 8)}...
                            </p>
                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 mt-6 text-[10px] font-black uppercase tracking-widest text-white/40">
                                <div className="flex items-center gap-2">
                                    <Briefcase className="h-4 w-4 text-accent" /> {organization.tier} Tier
                                </div>
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-accent" /> Active Since {organization.createdAt ? format(organization.createdAt.toDate(), 'MMM yyyy') : 'N/A'}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <Button
                                variant="outline"
                                className="h-12 border-white/20 text-white hover:bg-white hover:text-primary px-6 rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none transition-all"
                                onClick={() => router.back()}
                            >
                                <ArrowLeft className="h-4 w-4 mr-2" /> Back
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                    {/* Main Workspace Details */}
                    <div className="xl:col-span-8 space-y-8">
                        <div className="bg-white border border-primary/10 rounded-tl-3xl rounded-br-3xl shadow-xl overflow-hidden">
                            <div className="p-8 md:p-10">
                                <h2 className="text-xl font-bold text-primary mb-8 flex items-center gap-2">
                                    <Building className="h-5 w-5 text-accent" />
                                    Institutional Identity
                                </h2>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                    <div className="space-y-6">
                                        <DetailItem icon={Briefcase} label="Entity Name" value={organization.name} />
                                        <DetailItem icon={Users} label="Total Authorized Slots" value={`${organization.maxLearners} Learners`} />
                                        <DetailItem icon={CreditCard} label="Service Tier" value={organization.tier} />
                                    </div>
                                    <div className="space-y-6">
                                        <DetailItem icon={Shield} label="Subscription Status" value={organization.status} highlight />
                                        <DetailItem icon={Calendar} label="Renewal Deadline" value={organization.subscriptionEndDate ? format(organization.subscriptionEndDate.toDate(), 'PPP') : 'No Expiry Set'} />
                                        <DetailItem icon={Globe} label="Portal Visibility" value="Publicly Indexed" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Admin Contact Card */}
                        <div className="bg-white border border-primary/10 rounded-tl-3xl rounded-br-3xl shadow-xl p-8 lg:p-10 relative overflow-hidden">
                            <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-accent/5 rounded-full blur-3xl" />
                            <h2 className="text-xl font-bold text-primary mb-8 flex items-center gap-2 font-headline">
                                <Users className="h-5 w-5 text-accent" />
                                Primary Administrative Contact
                            </h2>

                            {adminUser ? (
                                <div className="flex items-center gap-6 p-6 bg-primary/5 rounded-2xl border border-primary/5">
                                    <div className="h-16 w-16 rounded-tl-xl rounded-br-xl bg-primary text-white flex items-center justify-center text-2xl font-black">
                                        {adminUser.name.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="text-lg font-bold text-primary">{adminUser.name}</p>
                                        <p className="text-sm font-medium text-primary/60 flex items-center gap-2 mt-1">
                                            <Mail className="h-4 w-4" /> {adminUser.email}
                                        </p>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-accent mt-3">Authorized Workspace Admin</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-32 bg-primary/5 border-2 border-dashed border-primary/5 rounded-2xl">
                                    <Users className="h-8 w-8 text-primary/10 mb-2" />
                                    <p className="text-[10px] font-black uppercase tracking-widest text-primary/30">No administrator assigned to entity</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Management Sidebar */}
                    <div className="xl:col-span-4 space-y-8">
                        <div className="bg-primary text-white border border-primary/10 rounded-tl-3xl rounded-br-3xl shadow-xl p-8 relative overflow-hidden">
                            <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-accent/20 rounded-full blur-3xl opacity-20" />

                            <h2 className="text-xl font-bold mb-8 flex items-center gap-2">
                                <Settings2 className="h-5 w-5 text-accent" />
                                Fleet Management
                            </h2>

                            <div className="space-y-8 relative z-10">
                                <div className="space-y-4">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Lifecycle State Management</Label>
                                    <Select value={organization.status} onValueChange={handleStatusChange}>
                                        <SelectTrigger className="h-14 bg-white/10 border-white/10 text-white rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none font-bold shadow-lg">
                                            <div className="flex items-center gap-2">
                                                <Activity className="h-4 w-4 text-accent" />
                                                <SelectValue placeholder="Commit Transition" />
                                            </div>
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl border-primary/10 shadow-2xl">
                                            <SelectItem value="Trial" className="font-bold">Evaluation Phase (Trial)</SelectItem>
                                            <SelectItem value="Active" className="font-bold">Operational (Active)</SelectItem>
                                            <SelectItem value="Expired" className="font-bold">Halt Services (Expired)</SelectItem>
                                            <SelectItem value="Cancelled" className="font-bold">Terminate Relation (Cancelled)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="pt-8 border-t border-white/5">
                                    <div className="flex justify-between items-center mb-4">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Tier Allocation</span>
                                        <Badge variant="outline" className="text-accent border-accent text-[8px] font-black">{organization.tier}</Badge>
                                    </div>
                                    <p className="text-[10px] text-white/40 italic leading-relaxed">System state transitions are irreversible through this terminal. Audit logs will capture this action.</p>
                                </div>
                            </div>

                            <button className="w-full mt-10 bg-accent hover:bg-accent/90 text-white py-4 rounded-tl-xl rounded-br-xl font-black text-[10px] uppercase tracking-widest shadow-xl transition-all active:scale-95">
                                Trigger Global Sync
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function DetailItem({ icon: Icon, label, value, highlight = false }: any) {
    return (
        <div className="flex items-start gap-4">
            <div className="h-10 w-10 shrink-0 flex items-center justify-center rounded-tl-lg rounded-br-lg bg-primary/5 text-accent">
                <Icon className="h-5 w-5" />
            </div>
            <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-primary/40 mb-1">{label}</p>
                <p className={cn("text-base font-bold text-primary", highlight && "text-accent")}>{value || 'Not Indexed'}</p>
            </div>
        </div>
    );
}
