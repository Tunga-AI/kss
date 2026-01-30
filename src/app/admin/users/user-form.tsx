'use client';
import type { User } from '@/lib/user-types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRouter } from 'next/navigation';
import { useFirestore, useStorage } from '@/firebase';
import { addUser, updateUser } from '@/lib/users';
import React, { useState } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const roles: User['role'][] = ['Learner', 'Sales', 'Finance', 'Business', 'Operations', 'Admin', 'Facilitator'];

export function UserForm({ user }: { user?: Partial<User> }) {
    const isNew = !user?.id;
    const [formData, setFormData] = useState<Partial<User>>({
        name: '',
        email: '',
        role: 'Learner',
        status: 'Active',
        avatar: '',
        ...user, // Spread the passed user object to override defaults
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
        setFormData(prev => ({ ...prev, [id]: value as any }));
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
        
        let dataToSave = { ...formData };
        
        if (imageFile) {
            const uniqueFileName = `${(dataToSave.email || dataToSave.name)?.replace(/[^a-zA-Z0-9]/g, '-')}-${Date.now()}`;
            const storageRef = ref(storage, `avatars/${uniqueFileName}`);
            await uploadBytes(storageRef, imageFile);
            dataToSave.avatar = await getDownloadURL(storageRef);
        } else if (isNew && !dataToSave.avatar) {
             dataToSave.avatar = `https://picsum.photos/seed/${dataToSave.name?.toLowerCase().replace(' ', '')}/100/100`;
        }

        try {
            if (isNew) {
                // Assert that required fields for a new user are present
                const newUser = dataToSave as Omit<User, 'id' | 'createdAt'>;
                if (!newUser.name || !newUser.email || !newUser.role || !newUser.status) {
                    throw new Error("Missing required fields for new user.");
                }
                await addUser(firestore, newUser);
            } else if (dataToSave.id) {
                const { id, ...rest } = dataToSave;
                await updateUser(firestore, id, rest);
            }
            router.push('/a/users');
        } catch (error) {
            console.error("Failed to save user:", error);
            // In a real app, show a toast notification to the user
            alert("Failed to save user.");
        } finally {
            setIsSaving(false);
        }
    };

    let title = isNew ? 'Create New User' : 'Edit User';
    let description = isNew
      ? 'Add a new user profile to the system. You will still need to create their authentication account in the Firebase Console.'
      : `Editing profile for ${user?.name}.`;

    if (isNew) {
      if (formData.role === 'Learner') {
        title = 'Add New Learner';
        description = "This creates a profile in both the main Users list and the Learners section. You will still need to create their authentication account in the Firebase Console.";
      } else if (formData.role === 'Facilitator') {
        title = 'Create New Facilitator';
        description = "This creates a profile for a new Facilitator. You will still need to create their authentication account in the Firebase Console.";
      }
    }


    return (
        <div className="grid gap-6">
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline text-xl sm:text-2xl">{title}</CardTitle>
                    <CardDescription>
                        {description}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form className="grid gap-6" onSubmit={handleSubmit}>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="grid gap-3">
                                <Label htmlFor="name">Full Name</Label>
                                <Input id="name" type="text" value={formData.name} onChange={handleChange} required />
                            </div>
                            <div className="grid gap-3">
                                <Label htmlFor="email">Email</Label>
                                <Input id="email" type="email" value={formData.email} onChange={handleChange} required disabled={!isNew} />
                            </div>
                        </div>

                        <div className="grid gap-3">
                            <Label htmlFor="avatar">Profile Picture</Label>
                            <Input id="avatar" type="file" onChange={handleImageChange} accept="image/*" />
                            {formData.avatar && !imageFile && (
                                <div className="mt-2">
                                    <p className="text-sm text-muted-foreground">Current image:</p>
                                    <img src={formData.avatar} alt="Current avatar" className="w-20 h-20 object-cover rounded-full mt-1" />
                                </div>
                            )}
                        </div>

                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="grid gap-3">
                                <Label htmlFor="role">Role</Label>
                                <Select value={formData.role} onValueChange={(value) => handleSelectChange('role', value)} required>
                                    <SelectTrigger id="role">
                                        <SelectValue placeholder="Select role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {roles.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                             <div className="grid gap-3">
                                <Label htmlFor="status">Status</Label>
                                <Select value={formData.status} onValueChange={(value) => handleSelectChange('status', value)} required>
                                    <SelectTrigger id="status">
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Active">Active</SelectItem>
                                        <SelectItem value="Inactive">Inactive</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        
                        <div className="flex gap-4 mt-4">
                            <Button type="submit" disabled={isSaving}>{isSaving ? 'Saving...' : 'Save User'}</Button>
                            <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSaving}>Cancel</Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
