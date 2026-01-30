'use client';
import { useMemo } from 'react';
import { useParams, notFound, useRouter } from 'next/navigation';
import { useFirestore, useDoc } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import type { SaleLead } from '@/lib/sales-types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function LeadDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = Array.isArray(params.id) ? params.id[0] : params.id;
    const firestore = useFirestore();

    const leadRef = useMemo(() => {
        if (!firestore || !id) return null;
        return doc(firestore, 'sales', id);
    }, [firestore, id]);

    const { data: lead, loading } = useDoc<SaleLead>(leadRef);

    const handleStatusChange = async (newStatus: SaleLead['status']) => {
        if (leadRef) {
            await updateDoc(leadRef, { status: newStatus });
        }
    };

    if (loading) {
        return (
            <div className="grid gap-6 p-4 sm:p-6 lg:p-10">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-64 w-full" />
            </div>
        );
    }

    if (!lead) {
        notFound();
    }

    return (
        <div className="grid gap-6 p-4 sm:p-6 lg:p-10">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" onClick={() => router.back()}>
                    <ArrowLeft />
                </Button>
                <div>
                    <h1 className="font-headline text-xl sm:text-2xl font-bold">{lead.name}</h1>
                    <p className="text-muted-foreground">{lead.email}</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Lead Details</CardTitle>
                    <CardDescription>Manage this lead's information and status in the sales pipeline.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <Label>Name</Label>
                            <p className="font-medium">{lead.name}</p>
                        </div>
                        <div className="space-y-1">
                            <Label>Email</Label>
                            <p className="font-medium">{lead.email}</p>
                        </div>
                    </div>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <Label>Interested Program</Label>
                            <p className="font-medium">{lead.program || 'Not specified'}</p>
                        </div>
                         <div className="space-y-1">
                            <Label>Admission Date</Label>
                            <p className="font-medium">{lead.createdAt ? lead.createdAt.toDate().toLocaleDateString() : 'N/A'}</p>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="status-select">Status</Label>
                        <div className="flex items-center gap-4">
                             <Select value={lead.status} onValueChange={handleStatusChange}>
                                <SelectTrigger id="status-select" className="w-[200px]">
                                    <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Prospect">Prospect</SelectItem>
                                    <SelectItem value="Lead">Lead</SelectItem>
                                    <SelectItem value="Admitted">Admitted</SelectItem>
                                    <SelectItem value="Lost">Lost</SelectItem>
                                </SelectContent>
                            </Select>
                            <Badge variant={lead.status === 'Admitted' ? 'default' : lead.status === 'Lost' ? 'destructive' : 'secondary'}>
                                {lead.status}
                            </Badge>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
