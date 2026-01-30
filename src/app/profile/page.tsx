'use client';
import { useMemo } from 'react';
import { useFirestore, useDoc } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { User } from '@/lib/user-types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { notFound } from 'next/navigation';

export default function ProfilePage() {
    const firestore = useFirestore();
    // In a real app, you would get the current user's ID from the auth state.
    // For now, we'll hardcode a sample user ID.
    // Make sure a user with this ID exists in your 'users' collection in Firestore.
    const userId = 'sample-user-id';

    const userRef = useMemo(() => {
        if (!firestore || !userId) return null;
        return doc(firestore, 'users', userId);
    }, [firestore, userId]);

    const { data: user, loading } = useDoc<User>(userRef);

    if (loading) {
        return (
             <Card className="max-w-2xl mx-auto">
                <CardHeader className="text-center">
                    <Skeleton className="h-24 w-24 rounded-full mx-auto mb-4" />
                    <Skeleton className="h-8 w-48 mx-auto" />
                    <Skeleton className="h-4 w-64 mx-auto" />
                </CardHeader>
                <CardContent className="grid gap-6">
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                     <div className="space-y-2">
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                     <div className="space-y-2">
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-10 w-32" />
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (!user) {
        // You can replace this with a more user-friendly message or component
        return (
             <Card className="max-w-2xl mx-auto">
                <CardHeader>
                    <CardTitle>User Not Found</CardTitle>
                    <CardDescription>Could not find a profile. Please ensure you are logged in or contact support.</CardDescription>
                </CardHeader>
             </Card>
        )
    }

    return (
        <Card className="max-w-2xl mx-auto">
            <CardHeader className="text-center items-center">
                <Avatar className="h-24 w-24 mb-4">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <CardTitle className="font-headline text-2xl">{user.name}</CardTitle>
                <CardDescription>{user.email}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6">
                 <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" defaultValue={user.name} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input id="email" type="email" defaultValue={user.email} disabled />
                </div>
                <div className="space-y-2">
                    <Label>Role</Label>
                    <div>
                        <Badge variant={user.role === 'Admin' ? 'default' : 'secondary'}>{user.role}</Badge>
                    </div>
                </div>
                 <div className="space-y-2">
                    <Label>Member Since</Label>
                    <p className="text-sm text-muted-foreground">
                        {user.createdAt ? new Date(user.createdAt.toDate()).toLocaleDateString() : 'N/A'}
                    </p>
                </div>
                <Button>Update Profile</Button>
            </CardContent>
        </Card>
    );
}
