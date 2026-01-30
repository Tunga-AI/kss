'use client';
import { useState, useEffect } from 'react';
import { useFirestore, useStorage, useDoc } from '@/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, UploadCloud } from 'lucide-react';
import type { BrandingSettings } from '@/lib/settings-types';

export default function SettingsPage() {
    const firestore = useFirestore();
    const storage = useStorage();
    const { toast } = useToast();

    const settingsRef = firestore ? doc(firestore, 'settings', 'branding') : null;
    const { data: settings, loading: settingsLoading } = useDoc<BrandingSettings>(settingsRef);
    
    const [logoUrl, setLogoUrl] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        if (settings?.logoUrl) {
            setLogoUrl(settings.logoUrl);
        }
    }, [settings]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setImageFile(e.target.files[0]);
        }
    };

    const handleLogoUpload = async () => {
        if (!firestore || !storage || !imageFile) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please select a file to upload.' });
            return;
        }
        setIsUploading(true);

        try {
            const storageRef = ref(storage, 'settings/logo');
            await uploadBytes(storageRef, imageFile);
            const downloadURL = await getDownloadURL(storageRef);

            const settingsData = {
                logoUrl: downloadURL,
                updatedAt: serverTimestamp(),
            };

            await setDoc(doc(firestore, 'settings', 'branding'), settingsData, { merge: true });

            setLogoUrl(downloadURL);
            setImageFile(null);
            toast({ title: 'Success', description: 'Logo updated successfully.' });

        } catch (error) {
            console.error("Error uploading logo:", error);
            toast({ variant: 'destructive', title: 'Upload Failed', description: 'Could not upload the new logo.' });
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="grid gap-6">
            <Card className="bg-primary text-primary-foreground">
                <CardHeader>
                    <CardTitle className="font-headline text-xl sm:text-2xl">Application Settings</CardTitle>
                    <CardDescription className="text-primary-foreground/80">Manage global settings for the application.</CardDescription>
                </CardHeader>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Branding</CardTitle>
                    <CardDescription>Update your company logo.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-6">
                    <div className="space-y-2">
                        <Label>Current Logo</Label>
                        {settingsLoading ? <p>Loading...</p> : (
                            logoUrl ? (
                                <div className="relative h-20 w-40 rounded-md bg-muted p-2">
                                     <Image src={logoUrl} alt="Current Logo" fill className="object-contain" />
                                </div>
                            ) : <p className="text-sm text-muted-foreground">No logo has been uploaded yet.</p>
                        )}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="logo-upload">Upload New Logo</Label>
                        <Input id="logo-upload" type="file" onChange={handleImageChange} accept="image/*" disabled={isUploading} />
                    </div>
                     <Button onClick={handleLogoUpload} disabled={isUploading || !imageFile}>
                        {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UploadCloud className="mr-2" />}
                        Upload Logo
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
