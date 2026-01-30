'use client';
import { useMemo } from 'react';
import { useParams, notFound, useRouter } from 'next/navigation';
import { useFirestore, useDoc, useCollection } from '@/firebase';
import { doc, collection, query, where } from 'firebase/firestore';
import type { Organization } from '@/lib/organization-types';
import type { User } from '@/lib/user-types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { updateOrganizationStatus } from '@/app/actions/organizations';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

export default function OrganizationDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const id = Array.isArray(params.id) ? params.id[0] : params.id;
    const firestore = useFirestore();

    const orgRef = useMemo(() => {
        if (!firestore || !id) return null;
        return doc(firestore, 'organizations', id);
    }, [firestore, id]);

    const { data: organization, loading: orgLoading } = useDoc<Organization>(orgRef);

    const adminQuery = useMemo(() => {
        if (!firestore || !organization?.adminId) return null;
        return doc(firestore, 'users', organization.adminId);
    }, [firestore, organization]);

    const { data: adminUser, loading: adminLoading } = useDoc<User>(adminQuery);

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
            <div className="grid gap-6">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-64 w-full" />
            </div>
        );
    }

    if (!organization) {
        notFound();
    }
    
    const getStatusBadgeVariant = (status: Organization['status']) => {
        switch (status) {
            case 'Active':
            case 'Trial':
                return 'default';
            case 'Expired':
            case 'Cancelled':
                return 'destructive';
            default:
                return 'secondary';
        }
    }

    return (
        <div className="grid gap-6">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" onClick={() => router.back()}>
                    <ArrowLeft />
                </Button>
                <div>
                    <h1 className="font-headline text-xl sm:text-2xl font-bold">{organization.name}</h1>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Organization Details</CardTitle>
                    <CardDescription>Manage this organization's subscription and status.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <Label>Organization Name</Label>
                            <p className="font-medium">{organization.name}</p>
                        </div>
                        <div className="space-y-1">
                            <Label>Subscription Tier</Label>
                            <p><Badge variant="secondary">{organization.tier}</Badge></p>
                        </div>
                         <div className="space-y-1">
                            <Label>Admin Contact</Label>
                            <p className="font-medium">{adminUser ? `${adminUser.name} (${adminUser.email})` : 'Not assigned'}</p>
                        </div>
                         <div className="space-y-1">
                            <Label>Date Joined</Label>
                            <p className="font-medium">{organization.createdAt ? format(organization.createdAt.toDate(), 'yyyy-MM-dd') : 'N/A'}</p>
                        </div>
                        <div className="space-y-1">
                            <Label>Max Learners</Label>
                            <p className="font-medium">{organization.maxLearners}</p>
                        </div>
                        <div className="space-y-1">
                            <Label>Subscription End Date</Label>
                            <p className="font-medium">{organization.subscriptionEndDate ? format(organization.subscriptionEndDate.toDate(), 'yyyy-MM-dd') : 'N/A'}</p>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="status-select">Subscription Status</Label>
                        <div className="flex items-center gap-4">
                             <Select value={organization.status} onValueChange={handleStatusChange}>
                                <SelectTrigger id="status-select" className="w-[200px]">
                                    <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Trial">Trial</SelectItem>
                                    <SelectItem value="Active">Active</SelectItem>
                                    <SelectItem value="Expired">Expired</SelectItem>
                                    <SelectItem value="Cancelled">Cancelled</SelectItem>
                                </SelectContent>
                            </Select>
                            <Badge variant={getStatusBadgeVariant(organization.status)}>
                                {organization.status}
                            </Badge>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
