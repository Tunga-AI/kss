'use client';
import { useState, useEffect, useRef } from 'react';
import { useUser, useFirestore, useStorage } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Camera, User as UserIcon, Mail, Shield, Calendar, CheckCircle2, RefreshCw } from 'lucide-react';
import { cn } from "@/lib/utils";
import ProfessionalProfile from './professional-profile';

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
            <div className="p-8 flex items-center justify-center min-h-[400px]">
                <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!user) {
        return (
            <div className="max-w-4xl mx-auto p-12 text-center bg-white border border-primary/10 rounded-tl-3xl rounded-br-3xl shadow-xl">
                <UserIcon className="h-16 w-16 text-primary/10 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-primary">Identity Not Verified</h2>
                <p className="text-primary/60 mt-2">Please ensure you are authenticated to manage your profile.</p>
            </div>
        );
    }

    return (
        <div className="w-full min-h-screen bg-gray-50/50 p-2 md:p-4 font-body">
            <div className="w-full">
                {/* Profile Hero Header */}
                <div className="bg-primary text-white p-6 mb-6 border-b border-primary/10 rounded-tl-3xl rounded-br-3xl rounded-tr-none rounded-bl-none shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-accent/20 rounded-full blur-3xl opacity-20" />

                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="flex flex-col md:flex-row items-center gap-6">
                            <div className="relative group cursor-pointer shrink-0" onClick={handleAvatarClick}>
                                <div className="h-24 w-24 md:h-32 md:w-32 rounded-tl-2xl rounded-br-2xl overflow-hidden border-2 border-white/20 shadow-xl relative bg-white/5">
                                    {isUploading ? (
                                        <div className="flex items-center justify-center h-full w-full bg-primary/20 backdrop-blur-sm">
                                            <Loader2 className="h-8 w-8 animate-spin text-accent" />
                                        </div>
                                    ) : (
                                        <>
                                            <Avatar className="h-full w-full rounded-none">
                                                <AvatarImage src={user.avatar} className="object-cover" />
                                                <AvatarFallback className="rounded-none bg-accent/20 text-accent text-3xl font-black">
                                                    {user.name.charAt(0)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="absolute inset-0 bg-primary/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                                                <Camera className="h-8 w-8 text-white" />
                                            </div>
                                        </>
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
                            </div>

                            <div className="text-center md:text-left">
                                <div className="flex flex-col md:flex-row md:items-center gap-3 mb-1">
                                    <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">{user.name}</h1>
                                    <Badge className="w-fit mx-auto md:mx-0 bg-accent text-white font-black text-[10px] uppercase tracking-widest px-3 py-1 rounded-tl-md rounded-br-md rounded-tr-none rounded-bl-none border-none shadow-lg">
                                        Official {user.role}
                                    </Badge>
                                </div>
                                <p className="text-white/60 text-lg font-medium flex items-center justify-center md:justify-start gap-2">
                                    <Mail className="h-4 w-4" /> {user.email}
                                </p>
                                <div className="flex items-center justify-center md:justify-start gap-4 mt-4 text-[10px] font-black uppercase tracking-widest text-white/40">
                                    <div className="flex items-center gap-2">
                                        <Shield className="h-3 w-3 text-accent" /> Secure Account
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-3 w-3 text-accent" /> Joined {user.createdAt ? new Date(user.createdAt.toDate()).getFullYear() : 'N/A'}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="bg-white/10 px-6 py-3 rounded-tl-xl rounded-br-xl backdrop-blur-sm border border-white/10 text-center min-w-[140px]">
                                <p className="text-[10px] uppercase font-black tracking-widest text-white/60 mb-1">Account Status</p>
                                <div className="flex items-center justify-center gap-2">
                                    <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                                    <span className="font-bold">Active</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-8">
                    {/* Professional Resume Section */}
                    <div>
                        <h2 className="text-2xl font-bold text-primary mb-6 flex items-center gap-2">
                            Professional Resume
                        </h2>
                        <ProfessionalProfile />
                    </div>

                    {/* Account Settings Section */}
                    <div className="w-full bg-white shadow-lg border border-primary/10 overflow-hidden rounded-tl-2xl rounded-br-2xl rounded-tr-none rounded-bl-none">
                        <div className="p-8 md:p-12">
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
                                {/* Account Details */}
                                <div className="md:col-span-12 lg:col-span-8 space-y-8">
                                    <h2 className="text-xl font-bold text-primary flex items-center gap-3">
                                        <UserIcon className="h-5 w-5 text-accent" /> Account Metadata
                                    </h2>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-2">
                                            <Label htmlFor="name" className="text-[10px] uppercase font-black tracking-widest text-primary/40 ml-1">Legal Identity</Label>
                                            <Input
                                                id="name"
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                disabled={isSaving || isUploading}
                                                className="h-14 bg-primary/5 border-primary/10 rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none text-base font-medium focus:ring-accent"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="email" className="text-[10px] uppercase font-black tracking-widest text-primary/40 ml-1">Verified Email</Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                defaultValue={user.email!}
                                                disabled
                                                className="h-14 bg-primary/5 border-primary/10 rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none text-base font-medium opacity-50 cursor-not-allowed"
                                            />
                                        </div>
                                    </div>

                                    <div className="pt-8 border-t border-primary/5 flex justify-end">
                                        <Button
                                            onClick={handleUpdateProfile}
                                            disabled={isSaving || isUploading || name === user.name}
                                            className="bg-primary hover:bg-accent text-white h-14 px-10 rounded-tl-2xl rounded-br-2xl rounded-tr-none rounded-bl-none font-bold shadow-lg transition-all active:scale-95 disabled:opacity-50"
                                        >
                                            {isSaving ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <CheckCircle2 className="mr-2 h-5 w-5" />}
                                            Apply Changes
                                        </Button>
                                    </div>
                                </div>

                                {/* Sidebar Info */}
                                <div className="lg:col-span-4 space-y-8 bg-primary/5 p-8 rounded-tl-2xl rounded-br-2xl rounded-tr-none rounded-bl-none">
                                    <div>
                                        <h3 className="text-xs font-black uppercase tracking-widest text-primary/40 mb-4">Security Overview</h3>
                                        <div className="space-y-4">
                                            <SecurityItem label="Authentication" value="OAuth 2.0" />
                                            <SecurityItem label="Encryption" value="AES-256" />
                                            <SecurityItem label="Access Level" value={user.role} highlight />
                                        </div>
                                    </div>

                                    <div className="p-4 bg-white/50 border border-primary/5 rounded-xl text-[10px] text-primary/60 leading-relaxed italic">
                                        "Account security is maintained through the Global Skills Ecosystem identity provider."
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function SecurityItem({ label, value, highlight = false }: { label: string, value: string, highlight?: boolean }) {
    return (
        <div className="flex justify-between items-center py-2 border-b border-primary/5 last:border-0">
            <span className="text-[10px] font-bold text-primary/60">{label}</span>
            <span className={cn("text-xs font-black tracking-widest uppercase", highlight ? "text-accent" : "text-primary")}>{value}</span>
        </div>
    )
}
