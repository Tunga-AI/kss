'use client';
import type { Staff } from '@/lib/staff-types';
import type { User } from '@/lib/user-types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRouter } from 'next/navigation';
import { useFirestore, useStorage } from '@/firebase';
import { addUser, updateUser } from '@/lib/users';
import { createStaffProfile, updateStaff } from '@/lib/staff';
import React, { useState } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import {
    User as UserIcon,
    Mail,
    Shield,
    ArrowLeft,
    Save,
    RefreshCw,
    Settings2,
    Camera,
    Activity,
    Lock,
    Eye,
    Briefcase
} from 'lucide-react';

const roles: User['role'][] = ['Admin', 'Sales', 'Finance', 'Business', 'Operations'];

export function StaffForm({ staff }: { staff?: Partial<Staff> }) {
    const isNew = !staff?.id;
    const [formData, setFormData] = useState<Partial<Staff>>({
        name: '',
        email: '',
        role: 'Operations', // Default
        status: 'Active',
        avatar: '',
        jobTitle: '',
        ...staff,
    });
    const [isSaving, setIsSaving] = useState(false);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const router = useRouter();
    const firestore = useFirestore();
    const storage = useStorage();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const handleSelectChange = (id: 'role' | 'status', value: string) => {
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setImageFile(e.target.files[0]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!firestore || !storage) return;

        setIsSaving(true);

        const dataToSave = { ...formData }; // Clone
        let avatarUrl = dataToSave.avatar;

        if (imageFile) {
            const uniqueFileName = `${(dataToSave.email || dataToSave.name)?.replace(/[^a-zA-Z0-9]/g, '-')}-${Date.now()}`;
            const storageRef = ref(storage, `avatars/${uniqueFileName}`);
            await uploadBytes(storageRef, imageFile);
            avatarUrl = await getDownloadURL(storageRef);
            dataToSave.avatar = avatarUrl;
        } else if (isNew && !dataToSave.avatar) {
            avatarUrl = `https://picsum.photos/seed/${dataToSave.name?.toLowerCase().replace(' ', '')}/100/100`;
            dataToSave.avatar = avatarUrl;
        }

        try {
            if (isNew) {
                // 1. Create User
                // Need to cast specific role to User['role']
                const newUser: Omit<User, 'id' | 'createdAt'> = {
                    name: dataToSave.name!,
                    email: dataToSave.email!,
                    role: dataToSave.role as User['role'],
                    status: dataToSave.status as any,
                    avatar: avatarUrl
                };

                const newId = await addUser(firestore, newUser);

                // 2. Create Staff Profile
                await createStaffProfile(firestore,
                    { ...newUser, role: newUser.role },
                    dataToSave.jobTitle!,
                    newId
                );

            } else {
                if (!dataToSave.id) throw new Error("Missing ID for update");

                // Update User
                await updateUser(firestore, dataToSave.id, {
                    name: dataToSave.name,
                    role: dataToSave.role as User['role'],
                    status: dataToSave.status as any,
                    avatar: avatarUrl
                });

                // Update Staff
                await updateStaff(firestore, dataToSave.id, {
                    name: dataToSave.name,
                    jobTitle: dataToSave.jobTitle,
                    role: dataToSave.role,
                    status: dataToSave.status,
                    avatar: avatarUrl
                });
            }

            router.push('/a/staff');

        } catch (error) {
            console.error("Failed to save staff:", error);
            alert("Failed to save staff member.");
        } finally {
            setIsSaving(false);
        }
    };

    const title = isNew ? 'Add Staff Member' : 'Edit Staff Member';
    const description = isNew
        ? 'Register a new business administrator or support staff.'
        : `Modify profile for ${staff?.name}.`;

    return (
        <div className="w-full min-h-screen bg-gray-50/50 p-2 md:p-4 font-body">
            <div className="w-full max-w-[1440px] mx-auto">
                {/* Hero Header Section */}
                <div className="bg-primary text-white p-6 md:p-10 mb-6 border-b border-primary/10 rounded-tl-3xl rounded-br-3xl rounded-tr-none rounded-bl-none shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-accent/20 rounded-full blur-3xl opacity-20" />

                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="flex items-center gap-6">
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-12 w-12 border-white/20 text-white hover:bg-white hover:text-primary rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none transition-all"
                                onClick={() => router.back()}
                            >
                                <ArrowLeft className="h-6 w-6" />
                            </Button>
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <Shield className="h-6 w-6 text-accent" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-white/50">{isNew ? 'New Entry' : 'Authorization Modification'}</span>
                                </div>
                                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
                                    {title} <span className="text-white/40 font-mono text-xl ml-2">{isNew ? '' : `#${staff?.id}`}</span>
                                </h1>
                                <p className="text-white/40 text-[10px] uppercase font-bold tracking-widest mt-2">{description}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <Button
                                onClick={handleSubmit}
                                disabled={isSaving}
                                className="bg-accent hover:bg-accent/90 text-white border-none h-14 px-8 rounded-tl-2xl rounded-br-2xl rounded-tr-none rounded-bl-none font-bold shadow-lg transition-all active:scale-95"
                            >
                                {isSaving ? (
                                    <><RefreshCw className="h-5 w-5 mr-2 animate-spin" /> Saving...</>
                                ) : (
                                    <><Save className="h-5 w-5 mr-2" /> Save Staff</>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Primary Identity Section */}
                    <div className="lg:col-span-8 space-y-6">
                        <Card className="bg-white border border-primary/10 rounded-tl-3xl rounded-br-3xl shadow-xl overflow-hidden">
                            <div className="p-6 md:p-8">
                                <h2 className="text-xl font-bold text-primary mb-8 flex items-center gap-2">
                                    <UserIcon className="h-5 w-5 text-accent" />
                                    Identity Profile
                                </h2>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <Label htmlFor="name" className="text-[10px] uppercase font-black tracking-widest text-primary/40 ml-1">Legal Full Name</Label>
                                        <Input
                                            id="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            required
                                            className="h-14 bg-primary/5 border-primary/10 rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none font-bold"
                                            placeholder="Enter full name..."
                                        />
                                    </div>
                                    <div className="space-y-4">
                                        <Label htmlFor="email" className="text-[10px] uppercase font-black tracking-widest text-primary/40 ml-1">System Email Address</Label>
                                        <div className="relative">
                                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/30" />
                                            <Input
                                                id="email"
                                                type="email"
                                                value={formData.email}
                                                onChange={handleChange}
                                                required
                                                disabled={!isNew}
                                                className="pl-12 h-14 bg-primary/5 border-primary/10 rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none font-bold"
                                                placeholder="user@kssinstitute.org"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-4 md:col-span-2">
                                        <Label htmlFor="jobTitle" className="text-[10px] uppercase font-black tracking-widest text-primary/40 ml-1">Job Title / Designation</Label>
                                        <div className="relative">
                                            <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/30" />
                                            <Input
                                                id="jobTitle"
                                                value={formData.jobTitle}
                                                onChange={handleChange}
                                                required
                                                className="pl-12 h-14 bg-primary/5 border-primary/10 rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none font-bold"
                                                placeholder="e.g. Finance Manager, Sales Associate..."
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-12 p-6 bg-primary/5 rounded-2xl border border-primary/5 flex items-start gap-4">
                                    <Lock className="h-5 w-5 text-accent shrink-0 mt-1" />
                                    <div>
                                        <p className="text-xs font-bold text-primary">Federated Authentication Reminder</p>
                                        <p className="text-[10px] text-primary/60 mt-1 leading-relaxed">This record manages the internal database profile. Federated login credentials must be independently managed via the Firebase Authentication console.</p>
                                    </div>
                                </div>
                            </div>
                        </Card>

                        {/* Visual Identity */}
                        <Card className="bg-white border border-primary/10 rounded-tl-3xl rounded-br-3xl shadow-xl p-6 md:p-8">
                            <h2 className="text-xl font-bold text-primary mb-8 flex items-center gap-2">
                                <Camera className="h-5 w-5 text-accent" />
                                Visual Identity
                            </h2>

                            <div className="flex flex-col md:flex-row items-center gap-10">
                                <div className="relative shrink-0">
                                    <div className="h-32 w-32 rounded-tl-3xl rounded-br-3xl bg-primary/5 border-2 border-primary/10 flex items-center justify-center overflow-hidden relative group">
                                        {(formData.avatar || imageFile) ? (
                                            <img
                                                src={imageFile ? URL.createObjectURL(imageFile) : formData.avatar}
                                                alt="Avatar preview"
                                                className="h-full w-full object-cover transition-transform group-hover:scale-110"
                                            />
                                        ) : (
                                            <UserIcon className="h-12 w-12 text-primary/10" />
                                        )}
                                        <div className="absolute inset-0 bg-primary/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                            <Eye className="h-6 w-6 text-white" />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex-1 space-y-4 w-full">
                                    <Label htmlFor="avatar" className="text-[10px] uppercase font-black tracking-widest text-primary/40 ml-1">Update Avatar Asset</Label>
                                    <Input
                                        id="avatar"
                                        type="file"
                                        onChange={handleImageChange}
                                        accept="image/*"
                                        className="h-12 bg-primary/5 border-primary/10 rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none font-bold file:mr-4 file:py-1 file:px-3 file:rounded-tl-md file:rounded-br-md file:border-0 file:text-[10px] file:font-black file:uppercase file:bg-primary file:text-white"
                                    />
                                    <p className="text-[9px] text-primary/40 italic">Recommend 500x500px square format for optimal fidelity.</p>
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* Access Controls Sidebar */}
                    <div className="lg:col-span-4 space-y-6">
                        <Card className="bg-primary text-white border border-primary/10 rounded-tl-3xl rounded-br-3xl shadow-xl p-8 relative overflow-hidden">
                            <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-accent/20 rounded-full blur-3xl opacity-20" />

                            <h2 className="text-xl font-bold mb-8 flex items-center gap-2 relative z-10">
                                <Settings2 className="h-5 w-5 text-accent" />
                                System Access
                            </h2>

                            <div className="space-y-8 relative z-10">
                                <div className="space-y-4">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">System Role</Label>
                                    <Select value={formData.role} onValueChange={(value) => handleSelectChange('role', value)} required>
                                        <SelectTrigger className="h-14 bg-white/10 border-white/10 text-white rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none font-bold">
                                            <div className="flex items-center gap-2">
                                                <Shield className="h-4 w-4 text-accent" />
                                                <SelectValue placeholder="Assign Role" />
                                            </div>
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl border-primary/10">
                                            {roles.map(r => <SelectItem key={r} value={r} className="font-bold">{r}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-4">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Lifecycle Status</Label>
                                    <Select value={formData.status} onValueChange={(value) => handleSelectChange('status', value)} required>
                                        <SelectTrigger className="h-14 bg-white/10 border-white/10 text-white rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none font-bold">
                                            <div className="flex items-center gap-2">
                                                <Activity className="h-4 w-4 text-accent" />
                                                <SelectValue />
                                            </div>
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl border-primary/10">
                                            <SelectItem value="Active" className="font-bold">Active</SelectItem>
                                            <SelectItem value="Inactive" className="font-bold">Suspended</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="mt-12 pt-8 border-t border-white/5 space-y-4">
                                <p className="text-[10px] text-white/40 italic leading-relaxed">Modification of authorization tiers will immediately impact user session permissions across all terminals.</p>
                            </div>
                        </Card>
                    </div>
                </form>
            </div>
        </div>
    );
}
