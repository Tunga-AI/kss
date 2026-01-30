'use client';
import { useState, useEffect, useRef } from 'react';
import { useUser } from '@/firebase';
import { useFirestore, useStorage } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Pencil } from 'lucide-react';

export default function ProfilePageContent() {
    const { user, loading: userLoading } = useUser();
    const firestore = useFirestore();
    const storage = useStorage();
    const { toast } = useToast();
    
    const [name, setName] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (user) {
            setName(user.name);
        }
    }, [user]);

    const handleAvatarClick = () => {
        if (!isUploading) {
            fileInputRef.current?.click();
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0] && user && storage && firestore) {
            const file = e.target.files[0];
            setIsUploading(true);
    
            const storageRef = ref(storage, `avatars/${user.id}`);
            try {
                await uploadBytes(storageRef, file);
                const downloadURL = await getDownloadURL(storageRef);
                const userRef = doc(firestore, 'users', user.id);
                await updateDoc(userRef, { avatar: downloadURL });
    
                toast({ title: 'Success', description: 'Profile picture updated.' });
            } catch (error) {
                console.error("Error uploading image: ", error);
                toast({ variant: 'destructive', title: 'Upload Failed', description: 'Could not update profile picture.' });
            } finally {
                setIsUploading(false);
            }
        }
    };

    const handleUpdateProfile = async () => {
        if (!user || !firestore || !user.id || name === user.name) {
            return;
        }

        setIsSaving(true);
        const userRef = doc(firestore, 'users', user.id);
        try {
            await updateDoc(userRef, { name });
            toast({ title: 'Success', description: 'Your profile has been updated.' });
        } catch (error) {
            console.error("Error updating profile: ", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to update profile.' });
        } finally {
            setIsSaving(false);
        }
    };

    if (userLoading) {
        return (
            <Card className="max-w-2xl mx-auto">
                <CardHeader className="text-center items-center">
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
                        <Skeleton className="h-6 w-24" />
                    </div>
                     <div className="space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-32" />
                    </div>
                    <Skeleton className="h-10 w-32" />
                </CardContent>
            </Card>
        );
    }

    if (!user) {
        return (
            <Card className="max-w-2xl mx-auto">
                <CardHeader>
                    <CardTitle>Profile Not Found</CardTitle>
                    <CardDescription>Could not find a profile. Please ensure you are logged in or contact support.</CardDescription>
                </CardHeader>
            </Card>
        )
    }

    return (
        <Card className="max-w-2xl mx-auto">
            <CardHeader className="text-center items-center">
                <div className="relative group cursor-pointer" onClick={handleAvatarClick}>
                    <Avatar className="h-24 w-24 mb-4">
                         {isUploading ? (
                             <div className="flex items-center justify-center h-full w-full bg-muted rounded-full">
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            </div>
                        ) : (
                            <>
                                <AvatarImage src={user.avatar} alt={user.name} />
                                <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                            </>
                        )}
                    </Avatar>
                     {!isUploading && (
                        <div className="absolute inset-0 h-24 w-24 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Pencil className="text-white h-8 w-8" />
                        </div>
                    )}
                </div>
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                    disabled={isUploading}
                />
                <CardTitle className="font-headline text-2xl">{user.name}</CardTitle>
                <CardDescription>{user.email}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6">
                <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" value={name} onChange={(e) => setName(e.target.value)} disabled={isSaving || isUploading} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input id="email" type="email" defaultValue={user.email!} disabled />
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
                <Button onClick={handleUpdateProfile} disabled={isSaving || isUploading || name === user.name}>
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Update Profile
                </Button>
            </CardContent>
        </Card>
    );
}
