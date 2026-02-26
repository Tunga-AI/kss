'use client';
import { useState, useEffect } from 'react';
import { useUsersFirestore, useStorage, useDoc, useUser } from '@/firebase';
import { doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, UploadCloud, Settings, RefreshCw, Palette, ShieldCheck, Database, Globe, Mail, Save, Send } from 'lucide-react';
import type { BrandingSettings, EmailSettings } from '@/lib/settings-types';
import { cn } from "@/lib/utils";
import { Card } from '@/components/ui/card';

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState('branding');

    return (
        <div className="w-full min-h-screen bg-gray-50/50 p-2 md:p-4 font-body">
            <div className="w-full">
                {/* Settings Hero Section */}
                <div className="bg-primary text-white p-6 mb-6 border-b border-primary/10 rounded-tl-3xl rounded-br-3xl rounded-tr-none rounded-bl-none shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-accent/20 rounded-full blur-3xl opacity-20" />

                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <Settings className="h-8 w-8 bg-accent/20 p-1.5 rounded-lg text-accent" />
                                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">System Configuration</h1>
                            </div>
                            <p className="text-white/80 text-lg font-medium">Global parameters and ecosystem branding preferences</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Navigation / Categories */}
                    <div className="lg:col-span-3 space-y-2">
                        <SettingsNavButton
                            icon={Palette}
                            label="Branding & UI"
                            active={activeTab === 'branding'}
                            onClick={() => setActiveTab('branding')}
                        />
                        <SettingsNavButton
                            icon={Mail}
                            label="Email & Communication"
                            active={activeTab === 'email'}
                            onClick={() => setActiveTab('email')}
                        />
                        <SettingsNavButton
                            icon={ShieldCheck}
                            label="Security & Access"
                            active={activeTab === 'security'}
                            onClick={() => setActiveTab('security')}
                        />
                        <SettingsNavButton icon={Globe} label="Localization" />
                        <SettingsNavButton icon={Database} label="System Log" />
                    </div>

                    {/* Main Content */}
                    <div className="lg:col-span-9">
                        <div className="bg-white border border-primary/10 rounded-tl-3xl rounded-br-3xl shadow-xl p-8 lg:p-12">
                            {activeTab === 'branding' && <BrandingConfiguration />}
                            {activeTab === 'email' && <EmailConfiguration />}
                            {activeTab === 'security' && (
                                <div className="text-center py-12">
                                    <ShieldCheck className="h-12 w-12 mx-auto text-primary/20 mb-4" />
                                    <h3 className="text-xl font-bold text-primary">Security Settings</h3>
                                    <p className="text-primary/60">Advanced security configurations coming soon.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function SettingsNavButton({ icon: Icon, label, active = false, onClick }: { icon: any, label: string, active?: boolean, onClick?: () => void }) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "w-full flex items-center gap-4 px-6 py-4 rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none font-bold text-sm transition-all text-left",
                active
                    ? "bg-primary text-white shadow-xl shadow-primary/20 scale-105 z-10"
                    : "bg-white text-primary/60 hover:bg-primary/5 border border-primary/5"
            )}>
            <Icon className={cn("h-5 w-5", active ? "text-accent" : "text-primary/20")} />
            {label}
        </button>
    )
}

function BrandingConfiguration() {
    const firestore = useUsersFirestore();
    const storage = useStorage();
    const { toast } = useToast();

    const settingsRef = firestore ? doc(firestore, 'settings', 'branding') : null;
    const { data: settings, loading: settingsLoading } = useDoc<BrandingSettings>(settingsRef as any);

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

    if (settingsLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <>
            <h2 className="text-2xl font-bold text-primary mb-2">Branding Assets</h2>
            <p className="text-primary/60 mb-10 pb-6 border-b border-primary/5">Configure the visual identity of the learning portal.</p>

            <div className="space-y-12">
                {/* Logo Configuration */}
                <ImageUploader
                    label="Platform Logo"
                    description="Visible in navigation and public pages. SVG or PNG recommended."
                    currentUrl={settings?.logoUrl}
                    storagePath="settings/logo"
                    field="logoUrl"
                    firestore={firestore}
                />

                <ImageUploader
                    label="Favicon"
                    description="Browser tab icon. ICO, PNG, or SVG format. 32x32px or 16x16px recommended."
                    currentUrl={settings?.faviconUrl}
                    storagePath="settings/favicon"
                    field="faviconUrl"
                    firestore={firestore}
                />

                <div className="h-px bg-primary/5 my-8" />

                <h3 className="text-xl font-bold text-primary mb-6">Page Headers (Hero Sections)</h3>

                <ImageUploader
                    label="Home Page Hero"
                    description="The main banner image on the landing page."
                    currentUrl={settings?.homeHeroUrl}
                    storagePath="settings/hero_home"
                    field="homeHeroUrl"
                    firestore={firestore}
                    aspect="landscape"
                />

                <ImageUploader
                    label="Programs Page Hero"
                    description="Header image for the programs listing page."
                    currentUrl={settings?.programsHeroUrl}
                    storagePath="settings/hero_programs"
                    field="programsHeroUrl"
                    firestore={firestore}
                    aspect="landscape"
                />

                <ImageUploader
                    label="Contact Page Hero"
                    description="Header image for the contact page."
                    currentUrl={settings?.contactHeroUrl}
                    storagePath="settings/hero_contact"
                    field="contactHeroUrl"
                    firestore={firestore}
                    aspect="landscape"
                />

                <ImageUploader
                    label="About Page Hero"
                    description="Header image for the about/mission page."
                    currentUrl={settings?.aboutHeroUrl}
                    storagePath="settings/hero_about"
                    field="aboutHeroUrl"
                    firestore={firestore}
                    aspect="landscape"
                />

                <ImageUploader
                    label="Framework Page Hero"
                    description="Header image for the framework page."
                    currentUrl={settings?.frameworkHeroUrl}
                    storagePath="settings/hero_framework"
                    field="frameworkHeroUrl"
                    firestore={firestore}
                    aspect="landscape"
                />

                <ImageUploader
                    label="E-Learning Page Hero"
                    description="Header image for the e-learning courses page."
                    currentUrl={settings?.elearningHeroUrl}
                    storagePath="settings/hero_elearning"
                    field="elearningHeroUrl"
                    firestore={firestore}
                    aspect="landscape"
                />

                <ImageUploader
                    label="Events Page Hero"
                    description="Header image for the events page."
                    currentUrl={settings?.eventsHeroUrl}
                    storagePath="settings/hero_events"
                    field="eventsHeroUrl"
                    firestore={firestore}
                    aspect="landscape"
                />

                <ImageUploader
                    label="For Business Page Hero"
                    description="Header image for the business/corporate page."
                    currentUrl={settings?.businessHeroUrl}
                    storagePath="settings/hero_business"
                    field="businessHeroUrl"
                    firestore={firestore}
                    aspect="landscape"
                />

                <ImageUploader
                    label="Gallery Page Hero"
                    description="Header image for the gallery page."
                    currentUrl={settings?.galleryHeroUrl}
                    storagePath="settings/hero_gallery"
                    field="galleryHeroUrl"
                    firestore={firestore}
                    aspect="landscape"
                />

                <ImageUploader
                    label="Login Page Hero"
                    description="Background image for the login page."
                    currentUrl={settings?.loginHeroUrl}
                    storagePath="settings/hero_login"
                    field="loginHeroUrl"
                    firestore={firestore}
                    aspect="landscape"
                />
            </div>
        </>
    );
}

function ImageUploader({ label, description, currentUrl, storagePath, field, firestore, aspect = 'auto' }: any) {
    const storage = useStorage();
    const { toast } = useToast();
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState(currentUrl);

    useEffect(() => {
        setPreviewUrl(currentUrl);
    }, [currentUrl]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setImageFile(e.target.files[0]);
            // Create local preview
            const objectUrl = URL.createObjectURL(e.target.files[0]);
            setPreviewUrl(objectUrl);
        }
    };

    const handleUpload = async () => {
        if (!firestore || !storage || !imageFile) return;
        setIsUploading(true);

        try {
            const storageRef = ref(storage, storagePath);
            await uploadBytes(storageRef, imageFile);
            const downloadURL = await getDownloadURL(storageRef);

            await setDoc(doc(firestore, 'settings', 'branding'), {
                [field]: downloadURL,
                updatedAt: serverTimestamp(),
            }, { merge: true });

            setImageFile(null);
            toast({ title: 'Success', description: `${label} updated successfully.` });
        } catch (error) {
            console.error("Error uploading:", error);
            // Revert preview
            setPreviewUrl(currentUrl);
            toast({ variant: 'destructive', title: 'Upload Failed', description: 'Could not upload the new image.' });
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            <div className="md:col-span-4">
                <Label className="text-[10px] uppercase font-black tracking-widest text-primary/40 block mb-1">Asset</Label>
                <p className="text-sm font-bold text-primary/80">{label}</p>
                <p className="text-xs text-primary/40 mt-2">{description}</p>
            </div>
            <div className="md:col-span-8 space-y-6">
                <div className="flex flex-col sm:flex-row items-center gap-8">
                    <div className={cn(
                        "relative rounded-tl-2xl rounded-br-2xl bg-primary/5 border border-primary/10 flex items-center justify-center overflow-hidden p-4 group",
                        aspect === 'landscape' ? 'w-full h-40' : 'h-24 w-48'
                    )}>
                        {previewUrl ? (
                            <Image src={previewUrl} alt={label} fill className="object-contain p-2 transition-transform group-hover:scale-105" />
                        ) : (
                            <div className="flex flex-col items-center gap-2 opacity-20">
                                <UploadCloud className="h-8 w-8" />
                                <span className="text-[8px] font-black uppercase">No Asset Found</span>
                            </div>
                        )}
                    </div>

                    <div className="flex-1 w-full flex flex-col gap-4">
                        <div className="relative group">
                            <Input
                                type="file"
                                onChange={handleImageChange}
                                className="h-12 bg-primary/5 border-primary/10 rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none font-medium file:mr-4 file:py-1 file:px-3 file:rounded-tl-md file:rounded-br-md file:border-0 file:text-[10px] file:font-black file:uppercase file:bg-primary file:text-white"
                                accept="image/*"
                                disabled={isUploading}
                            />
                        </div>
                        {imageFile && (
                            <Button
                                onClick={handleUpload}
                                disabled={isUploading}
                                className="bg-secondary hover:bg-secondary/90 text-white border-none h-12 px-6 rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none font-bold shadow-lg transition-all active:scale-95 disabled:opacity-50"
                            >
                                {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UploadCloud className="mr-2 h-4 w-4" />}
                                Save Change
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function EmailConfiguration() {
    const firestore = useUsersFirestore();
    const { toast } = useToast();
    const { user } = useUser();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState(false);

    const [config, setConfig] = useState({
        smtpHost: '',
        smtpPort: 587,
        smtpUser: '',
        smtpPass: '',
        fromName: '',
        fromEmail: ''
    });

    useEffect(() => {
        async function fetchSettings() {
            if (!firestore) return;
            try {
                const docRef = doc(firestore, 'settings', 'email');
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setConfig({
                        smtpHost: data.smtpHost || '',
                        smtpPort: data.smtpPort || 587,
                        smtpUser: data.smtpUser || '',
                        smtpPass: data.smtpPass || '',
                        fromName: data.fromName || '',
                        fromEmail: data.fromEmail || ''
                    });
                }
            } catch (error) {
                console.error("Error fetching email settings:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchSettings();
    }, [firestore]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!firestore) return;
        setSaving(true);
        try {
            await setDoc(doc(firestore, 'settings', 'email'), {
                ...config,
                updatedAt: serverTimestamp()
            });
            toast({ title: 'Success', description: 'Email settings saved.' });
        } catch (error) {
            console.error('Error saving settings:', error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to save settings.' });
        } finally {
            setSaving(false);
        }
    };

    const handleTest = async () => {
        if (!config.smtpHost || !user?.email) {
            toast({ variant: 'destructive', title: 'Error', description: 'Save settings first. Test will be sent to your email.' });
            return;
        }
        setTesting(true);
        try {
            const res = await fetch('/api/email/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    to: user.email,
                    subject: 'Test Email form Learning Portal',
                    text: 'This is a test email to verify your SMTP configuration.',
                    html: `
                        <div style="font-family: sans-serif; padding: 20px; text-align: center;">
                            <h2 style="color: #333;">It Works!</h2>
                            <p>Your email configuration is correct.</p>
                            <p style="color: #666; font-size: 12px; margin-top: 20px;">Sent from Learning Portal Admin</p>
                        </div>
                    `
                })
            });

            const data = await res.json();
            if (res.ok) {
                toast({ title: 'Email Sent', description: `Test email sent to ${user.email}` });
            } else {
                throw new Error(data.error || 'Failed to send');
            }
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Test Failed', description: error.message });
        } finally {
            setTesting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <>
            <div className="flex justify-between items-start mb-2">
                <h2 className="text-2xl font-bold text-primary">Email & Communication</h2>
            </div>
            <p className="text-primary/60 mb-10 pb-6 border-b border-primary/5">Configure SMTP server details for transactional emails.</p>

            <form onSubmit={handleSave} className="space-y-8 max-w-4xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label>SMTP Host</Label>
                        <Input
                            placeholder="smtp.example.com"
                            value={config.smtpHost}
                            onChange={e => setConfig({ ...config, smtpHost: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>SMTP Port</Label>
                        <Input
                            type="number"
                            placeholder="587"
                            value={config.smtpPort}
                            onChange={e => setConfig({ ...config, smtpPort: parseInt(e.target.value) || 587 })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>SMTP User</Label>
                        <Input
                            placeholder="mutunga@example.com"
                            value={config.smtpUser}
                            onChange={e => setConfig({ ...config, smtpUser: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>SMTP Password</Label>
                        <Input
                            type="password"
                            placeholder="••••••••"
                            value={config.smtpPass}
                            onChange={e => setConfig({ ...config, smtpPass: e.target.value })}
                        />
                    </div>
                </div>

                <div className="pt-6 border-t border-primary/5 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label>From Name</Label>
                        <Input
                            placeholder="Learning Portal Team"
                            value={config.fromName}
                            onChange={e => setConfig({ ...config, fromName: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>From Email</Label>
                        <Input
                            placeholder="mutunga@example.com"
                            value={config.fromEmail}
                            onChange={e => setConfig({ ...config, fromEmail: e.target.value })}
                        />
                    </div>
                </div>

                <div className="flex items-center gap-4 pt-4">
                    <Button
                        type="submit"
                        disabled={saving}
                        className="bg-primary hover:bg-primary/90 text-white font-bold px-8 h-12 rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none"
                    >
                        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Save Configuration
                    </Button>

                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleTest}
                        disabled={testing || saving}
                        className="font-bold px-8 h-12 rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none"
                    >
                        {testing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                        Send Test Email
                    </Button>
                </div>
            </form>
        </>
    );
}
