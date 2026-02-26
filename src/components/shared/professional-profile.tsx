'use client';

import { useState } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Briefcase, GraduationCap, Award, Plus, Pencil, Trash2, Loader2, Calendar } from 'lucide-react';
import type { User, WorkExperience, Education, Certification } from '@/lib/user-types';
import { useToast } from '@/hooks/use-toast';
import { cn } from "@/lib/utils";

export default function ProfessionalProfile() {
    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isSaving, setIsSaving] = useState(false);

    // Local state for editing fields
    const [summary, setSummary] = useState(user?.professionalProfile?.summary || '');

    if (!user) return null;

    const handleUpdateSummary = async () => {
        if (!firestore || !user.id) return;
        setIsSaving(true);
        try {
            const userRef = doc(firestore, 'users', user.id);
            await updateDoc(userRef, {
                'professionalProfile.summary': summary
            });
            toast({ title: 'Success', description: 'Professional summary updated.' });
        } catch (error) {
            console.error(error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to update summary.' });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-8">
            {/* Summary Section */}
            <div className="bg-white border border-primary/10 rounded-tl-3xl rounded-br-3xl shadow-lg p-8">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-primary flex items-center gap-2">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <Briefcase className="h-5 w-5 text-primary" />
                        </div>
                        Professional Summary
                    </h2>
                </div>
                <div className="space-y-4">
                    <Textarea
                        placeholder="Write a brief professional summary about yourself..."
                        className="min-h-[120px] bg-gray-50 border-primary/10 focus:ring-accent"
                        value={summary}
                        onChange={(e) => setSummary(e.target.value)}
                    />
                    <div className="flex justify-end">
                        <Button
                            onClick={handleUpdateSummary}
                            disabled={isSaving || summary === user.professionalProfile?.summary}
                            className="bg-primary hover:bg-accent text-white font-bold rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none"
                        >
                            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Summary
                        </Button>
                    </div>
                </div>
            </div>

            {/* Experience Section */}
            <ExperienceSection user={user} firestore={firestore} toast={toast} />

            {/* Education Section */}
            <EducationSection user={user} firestore={firestore} toast={toast} />

            {/* Certifications Section */}
            <CertificationSection user={user} firestore={firestore} toast={toast} />
        </div>
    );
}

function ExperienceSection({ user, firestore, toast }: { user: User, firestore: any, toast: any }) {
    const [isOpen, setIsOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<WorkExperience | null>(null);

    const handleSave = async (item: WorkExperience) => {
        if (!firestore || !user.id) return;

        // Sanitize item: remove undefined values and ensure proper types
        const sanitizedItem: WorkExperience = {
            id: item.id || crypto.randomUUID(),
            role: item.role || '',
            company: item.company || '',
            startDate: item.startDate || '',
            description: item.description || '',
            current: item.current || false,
            // Only include endDate if not current
            ...(item.current ? { endDate: undefined } : { endDate: item.endDate || '' }),
            skills: item.skills || []
        };

        // Remove undefined keys explicitly just in case
        const cleanItem = JSON.parse(JSON.stringify(sanitizedItem));

        const newExperience = editingItem
            ? user.professionalProfile?.experience?.map(e => e.id === item.id ? cleanItem : e) || [cleanItem]
            : [...(user.professionalProfile?.experience || []), cleanItem];

        try {
            const userRef = doc(firestore, 'users', user.id);
            // Ensure the nested structure exists using dot notation which Firestore handles, 
            // but if professionalProfile helps doesn't exist, we might need to be careful.
            // UpdateDoc with dot notation "professionalProfile.experience" handles the merge deep.
            await updateDoc(userRef, { 'professionalProfile.experience': newExperience });
            toast({ title: 'Success', description: 'Experience updated.' });
            setIsOpen(false);
            setEditingItem(null);
        } catch (error) {
            console.error(error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to update experience.' });
        }
    };

    const handleDelete = async (id: string) => {
        if (!firestore || !user.id) return;
        const newExperience = user.professionalProfile?.experience?.filter(e => e.id !== id) || [];
        try {
            const userRef = doc(firestore, 'users', user.id);
            await updateDoc(userRef, { 'professionalProfile.experience': newExperience });
            toast({ title: 'Success', description: 'Experience deleted.' });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete experience.' });
        }
    };

    return (
        <div className="bg-white border border-primary/10 rounded-tl-3xl rounded-br-3xl shadow-lg p-8">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-primary flex items-center gap-2">
                    <div className="p-2 bg-accent/10 rounded-lg">
                        <Briefcase className="h-5 w-5 text-accent" />
                    </div>
                    Work Experience
                </h2>
                <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) setEditingItem(null); }}>
                    <DialogTrigger asChild>
                        <Button variant="outline" className="border-primary/10 hover:bg-primary/5 text-primary font-bold rounded-tl-lg rounded-br-lg rounded-tr-none rounded-bl-none">
                            <Plus className="h-4 w-4 mr-2" /> Add Experience
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[600px] rounded-tl-3xl rounded-br-3xl rounded-tr-none rounded-bl-none border-primary/10" aria-describedby="experience-dialog-description">
                        <DialogHeader>
                            <DialogTitle>{editingItem ? 'Edit Experience' : 'Add Experience'}</DialogTitle>
                            <div id="experience-dialog-description" className="text-sm text-gray-500">
                                {editingItem ? 'Edit your existing work experience details below.' : 'Add new work experience details below.'}
                            </div>
                        </DialogHeader>
                        <ExperienceForm initialData={editingItem} onSave={handleSave} onCancel={() => setIsOpen(false)} />
                    </DialogContent>
                </Dialog>
            </div>

            <div className="space-y-6">
                {user.professionalProfile?.experience?.map((exp) => (
                    <div key={exp.id} className="relative pl-8 border-l-2 border-primary/10 pb-6 last:pb-0 group">
                        <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full bg-accent border-4 border-white" />
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="text-lg font-bold text-primary">{exp.role}</h3>
                                <div className="text-primary/70 font-medium mb-1">{exp.company}</div>
                                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary/40 mb-3">
                                    <Calendar className="h-3 w-3" />
                                    {new Date(exp.startDate).getFullYear()} - {exp.current ? 'Present' : (exp.endDate ? new Date(exp.endDate).getFullYear() : 'Present')}
                                </div>
                                <p className="text-sm text-primary/80 whitespace-pre-wrap">{exp.description}</p>
                            </div>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white pl-2">
                                <Button size="icon" variant="ghost" className="h-8 w-8 text-primary/60 hover:text-accent" onClick={() => { setEditingItem(exp); setIsOpen(true); }}>
                                    <Pencil className="h-4 w-4" />
                                </Button>
                                <Button size="icon" variant="ghost" className="h-8 w-8 text-primary/60 hover:text-red-500" onClick={() => handleDelete(exp.id)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                ))}
                {(!user.professionalProfile?.experience || user.professionalProfile.experience.length === 0) && (
                    <div className="text-center py-8 text-primary/40 italic">No work experience added</div>
                )}
            </div>
        </div>
    );
}

function ExperienceForm({ initialData, onSave, onCancel }: { initialData: WorkExperience | null, onSave: (data: any) => void, onCancel: () => void }) {
    const [formData, setFormData] = useState<Partial<WorkExperience>>(initialData || { role: '', company: '', description: '', startDate: '', endDate: '', current: false });

    return (
        <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Job Title</Label>
                    <Input value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })} placeholder="e.g. Senior Manager" />
                </div>
                <div className="space-y-2">
                    <Label>Company</Label>
                    <Input value={formData.company} onChange={e => setFormData({ ...formData, company: e.target.value })} placeholder="e.g. Acme Corp" />
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Input type="date" value={formData.startDate?.toString().split('T')[0]} onChange={e => setFormData({ ...formData, startDate: e.target.value })} />
                </div>
                <div className="space-y-2">
                    <Label>End Date</Label>
                    <Input type="date" disabled={formData.current} value={formData.endDate ? formData.endDate.toString().split('T')[0] : ''} onChange={e => setFormData({ ...formData, endDate: e.target.value })} />
                </div>
            </div>
            <div className="flex items-center gap-2">
                <input type="checkbox" id="current" checked={formData.current} onChange={e => setFormData({ ...formData, current: e.target.checked, endDate: undefined })} className="rounded border-gray-300 text-accent focus:ring-accent" />
                <Label htmlFor="current">I currently work here</Label>
            </div>
            <div className="space-y-2">
                <Label>Description</Label>
                <Textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Describe your responsibilities and achievements..." className="min-h-[100px]" />
            </div>
            <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={onCancel}>Cancel</Button>
                <Button onClick={() => onSave(formData)} className="bg-primary hover:bg-accent text-white">Save Experience</Button>
            </div>
        </div>
    );
}

function EducationSection({ user, firestore, toast }: { user: User, firestore: any, toast: any }) {
    const [isOpen, setIsOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<Education | null>(null);

    const handleSave = async (item: Education) => {
        if (!firestore || !user.id) return;
        const newEducation = editingItem
            ? user.professionalProfile?.education?.map(e => e.id === item.id ? item : e) || [item]
            : [...(user.professionalProfile?.education || []), { ...item, id: crypto.randomUUID() }];

        try {
            const userRef = doc(firestore, 'users', user.id);
            await updateDoc(userRef, { 'professionalProfile.education': newEducation });
            toast({ title: 'Success', description: 'Education updated.' });
            setIsOpen(false);
            setEditingItem(null);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to update education.' });
        }
    };

    const handleDelete = async (id: string) => {
        if (!firestore || !user.id) return;
        const newEducation = user.professionalProfile?.education?.filter(e => e.id !== id) || [];
        try {
            const userRef = doc(firestore, 'users', user.id);
            await updateDoc(userRef, { 'professionalProfile.education': newEducation });
            toast({ title: 'Success', description: 'Education deleted.' });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete education.' });
        }
    };

    return (
        <div className="bg-white border border-primary/10 rounded-tl-3xl rounded-br-3xl shadow-lg p-8">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-primary flex items-center gap-2">
                    <div className="p-2 bg-blue-500/10 rounded-lg">
                        <GraduationCap className="h-5 w-5 text-blue-600" />
                    </div>
                    Education
                </h2>
                <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) setEditingItem(null); }}>
                    <DialogTrigger asChild>
                        <Button variant="outline" className="border-primary/10 hover:bg-primary/5 text-primary font-bold rounded-tl-lg rounded-br-lg rounded-tr-none rounded-bl-none">
                            <Plus className="h-4 w-4 mr-2" /> Add Education
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[600px] rounded-tl-3xl rounded-br-3xl rounded-tr-none rounded-bl-none border-primary/10" aria-describedby="education-dialog-description">
                        <DialogHeader>
                            <DialogTitle>{editingItem ? 'Edit Education' : 'Add Education'}</DialogTitle>
                            <div id="education-dialog-description" className="text-sm text-gray-500">
                                {editingItem ? 'Edit your existing education details below.' : 'Add new education details below.'}
                            </div>
                        </DialogHeader>
                        <EducationForm initialData={editingItem} onSave={handleSave} onCancel={() => setIsOpen(false)} />
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid gap-6">
                {user.professionalProfile?.education?.map((edu) => (
                    <div key={edu.id} className="flex justify-between items-start p-4 bg-gray-50 border border-primary/5 rounded-xl group relative overflow-hidden">
                        <div className="flex gap-4">
                            <div className="h-12 w-12 rounded-full bg-white flex items-center justify-center border border-primary/10 shrink-0">
                                <GraduationCap className="h-6 w-6 text-primary/40" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-primary">{edu.institution}</h3>
                                <div className="text-primary/70 font-medium">{edu.degree} in {edu.fieldOfStudy}</div>
                                <div className="text-xs font-bold uppercase tracking-widest text-primary/40 mt-1">
                                    {new Date(edu.startDate).getFullYear()} - {edu.endDate ? new Date(edu.endDate).getFullYear() : 'Present'}
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-primary/60 hover:text-accent" onClick={() => { setEditingItem(edu); setIsOpen(true); }}>
                                <Pencil className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-primary/60 hover:text-red-500" onClick={() => handleDelete(edu.id)}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                ))}
                {(!user.professionalProfile?.education || user.professionalProfile.education.length === 0) && (
                    <div className="text-center py-8 text-primary/40 italic">No education added</div>
                )}
            </div>
        </div>
    );
}

function EducationForm({ initialData, onSave, onCancel }: { initialData: Education | null, onSave: (data: any) => void, onCancel: () => void }) {
    const [formData, setFormData] = useState<Partial<Education>>(initialData || { institution: '', degree: '', fieldOfStudy: '', startDate: '', endDate: '' });

    return (
        <div className="space-y-4 py-4">
            <div className="space-y-2">
                <Label>Institution</Label>
                <Input value={formData.institution} onChange={e => setFormData({ ...formData, institution: e.target.value })} placeholder="e.g. University of Technology" />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Degree</Label>
                    <Input value={formData.degree} onChange={e => setFormData({ ...formData, degree: e.target.value })} placeholder="e.g. Bachelor's" />
                </div>
                <div className="space-y-2">
                    <Label>Field of Study</Label>
                    <Input value={formData.fieldOfStudy} onChange={e => setFormData({ ...formData, fieldOfStudy: e.target.value })} placeholder="e.g. Computer Science" />
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Input type="date" value={formData.startDate?.toString().split('T')[0]} onChange={e => setFormData({ ...formData, startDate: e.target.value })} />
                </div>
                <div className="space-y-2">
                    <Label>End Date</Label>
                    <Input type="date" value={formData.endDate ? formData.endDate.toString().split('T')[0] : ''} onChange={e => setFormData({ ...formData, endDate: e.target.value })} />
                </div>
            </div>
            <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={onCancel}>Cancel</Button>
                <Button onClick={() => onSave(formData)} className="bg-primary hover:bg-accent text-white">Save Education</Button>
            </div>
        </div>
    );
}

function CertificationSection({ user, firestore, toast }: { user: User, firestore: any, toast: any }) {
    const [isOpen, setIsOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<Certification | null>(null);

    const handleSave = async (item: Certification) => {
        if (!firestore || !user.id) return;

        // Sanitize
        const sanitizedItem: Certification = {
            id: item.id || crypto.randomUUID(),
            name: item.name || '',
            issuer: item.issuer || '',
            issueDate: item.issueDate || '',
            expiryDate: item.expiryDate || '',
            credentialId: item.credentialId || '',
            credentialUrl: item.credentialUrl || ''
        };
        const cleanItem = JSON.parse(JSON.stringify(sanitizedItem));

        const newCertifications = editingItem
            ? user.professionalProfile?.certifications?.map(c => c.id === item.id ? cleanItem : c) || [cleanItem]
            : [...(user.professionalProfile?.certifications || []), cleanItem];

        try {
            const userRef = doc(firestore, 'users', user.id);
            await updateDoc(userRef, { 'professionalProfile.certifications': newCertifications });
            toast({ title: 'Success', description: 'Certification updated.' });
            setIsOpen(false);
            setEditingItem(null);
        } catch (error) {
            console.error(error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to update certification.' });
        }
    };

    const handleDelete = async (id: string) => {
        if (!firestore || !user.id) return;
        const newCertifications = user.professionalProfile?.certifications?.filter(c => c.id !== id) || [];
        try {
            const userRef = doc(firestore, 'users', user.id);
            await updateDoc(userRef, { 'professionalProfile.certifications': newCertifications });
            toast({ title: 'Success', description: 'Certification deleted.' });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete certification.' });
        }
    };

    return (
        <div className="bg-white border border-primary/10 rounded-tl-3xl rounded-br-3xl shadow-lg p-8">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-primary flex items-center gap-2">
                    <div className="p-2 bg-green-500/10 rounded-lg">
                        <Award className="h-5 w-5 text-green-600" />
                    </div>
                    Certifications
                </h2>
                <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) setEditingItem(null); }}>
                    <DialogTrigger asChild>
                        <Button variant="outline" className="border-primary/10 hover:bg-primary/5 text-primary font-bold rounded-tl-lg rounded-br-lg rounded-tr-none rounded-bl-none">
                            <Plus className="h-4 w-4 mr-2" /> Add Certification
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[600px] rounded-tl-3xl rounded-br-3xl rounded-tr-none rounded-bl-none border-primary/10" aria-describedby="certification-dialog-description">
                        <DialogHeader>
                            <DialogTitle>{editingItem ? 'Edit Certification' : 'Add Certification'}</DialogTitle>
                            <div id="certification-dialog-description" className="text-sm text-gray-500">
                                {editingItem ? 'Edit your existing certification details below.' : 'Add new certification details below.'}
                            </div>
                        </DialogHeader>
                        <CertificationForm initialData={editingItem} onSave={handleSave} onCancel={() => setIsOpen(false)} />
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
                {user.professionalProfile?.certifications?.map((cert) => (
                    <div key={cert.id} className="p-4 bg-gray-50 border border-primary/5 rounded-xl group relative">
                        <div className="flex gap-3 items-start">
                            <div className="h-10 w-10 rounded-lg bg-white flex items-center justify-center border border-primary/10 shrink-0">
                                <Award className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                                <h3 className="font-bold text-primary leading-tight">{cert.name}</h3>
                                <div className="text-sm text-primary/70">{cert.issuer}</div>
                                <div className="text-[10px] uppercase font-black tracking-widest text-primary/40 mt-1">
                                    Issued {new Date(cert.issueDate).toLocaleDateString()}
                                </div>
                            </div>
                        </div>
                        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-50 p-1 rounded-lg">
                            <Button size="icon" variant="ghost" className="h-6 w-6 text-primary/60 hover:text-accent" onClick={() => { setEditingItem(cert); setIsOpen(true); }}>
                                <Pencil className="h-3 w-3" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-6 w-6 text-primary/60 hover:text-red-500" onClick={() => handleDelete(cert.id)}>
                                <Trash2 className="h-3 w-3" />
                            </Button>
                        </div>
                    </div>
                ))}
                {(!user.professionalProfile?.certifications || user.professionalProfile.certifications.length === 0) && (
                    <div className="text-center py-8 text-primary/40 italic col-span-2">No certifications added</div>
                )}
            </div>
        </div>
    );
}

function CertificationForm({ initialData, onSave, onCancel }: { initialData: Certification | null, onSave: (data: any) => void, onCancel: () => void }) {
    const [formData, setFormData] = useState<Partial<Certification>>(initialData || { name: '', issuer: '', issueDate: '' });

    return (
        <div className="space-y-4 py-4">
            <div className="space-y-2">
                <Label>Certification Name</Label>
                <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. AWS Solutions Architect" />
            </div>
            <div className="space-y-2">
                <Label>Issuing Organization</Label>
                <Input value={formData.issuer} onChange={e => setFormData({ ...formData, issuer: e.target.value })} placeholder="e.g. Amazon Web Services" />
            </div>
            <div className="space-y-2">
                <Label>Issue Date</Label>
                <Input type="date" value={formData.issueDate?.toString().split('T')[0]} onChange={e => setFormData({ ...formData, issueDate: e.target.value })} />
            </div>
            <div className="space-y-2">
                <Label>Credential URL (Optional)</Label>
                <Input value={formData.credentialUrl || ''} onChange={e => setFormData({ ...formData, credentialUrl: e.target.value })} placeholder="https://..." />
            </div>
            <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={onCancel}>Cancel</Button>
                <Button onClick={() => onSave(formData)} className="bg-primary hover:bg-accent text-white">Save Certification</Button>
            </div>
        </div>
    )
}
