'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useFirestore } from '@/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Send } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

interface InterestFormProps {
    programTitle: string;
    trigger?: React.ReactNode;
}

export function InterestForm({ programTitle, trigger }: InterestFormProps) {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        message: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!firestore) return;

        setLoading(true);
        try {
            await addDoc(collection(firestore, 'leads'), {
                ...formData,
                program: programTitle,
                status: 'New',
                createdAt: serverTimestamp()
            });

            // Send confirmation email to the lead
            try {
                const response = await fetch('/api/email/send', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        to: formData.email,
                        subject: `Thank you for your interest in ${programTitle}`,
                        html: `
                            <!DOCTYPE html>
                            <html>
                              <head>
                                <style>
                                  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
                                  .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                                  .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                                  .content { background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; }
                                  .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 10px 10px; }
                                  .highlight { background: #f0f4ff; padding: 15px; border-left: 4px solid #667eea; margin: 20px 0; }
                                </style>
                              </head>
                              <body>
                                <div class="container">
                                  <div class="header">
                                    <h1 style="margin: 0;">KSS Academy</h1>
                                    <p style="margin: 10px 0 0 0; opacity: 0.9;">We received your inquiry!</p>
                                  </div>
                                  <div class="content">
                                    <h2>Hello ${formData.name},</h2>
                                    <p>Thank you for expressing interest in <strong>${programTitle}</strong>.</p>
                                    
                                    <div class="highlight">
                                      <strong>What happens next?</strong>
                                      <p style="margin: 10px 0 0 0;">Our admissions team will review your inquiry and contact you within 24-48 hours to discuss the program details and answer any questions you may have.</p>
                                    </div>
                                    
                                    <p>In the meantime, feel free to explore our website to learn more about our programs and community.</p>
                                    
                                    <p style="margin-top: 30px;">
                                      Best regards,<br>
                                      <strong>KSS Academy Team</strong>
                                    </p>
                                  </div>
                                  <div class="footer">
                                    <p>© ${new Date().getFullYear()} KSS Academy. All rights reserved.</p>
                                    <p style="margin-top: 10px;">
                                      <a href="mailto:hi@kss.or.ke" style="color: #667eea; text-decoration: none;">hi@kss.or.ke</a>
                                    </p>
                                  </div>
                                </div>
                              </body>
                            </html>
                        `,
                        text: `Hello ${formData.name},\n\nThank you for expressing interest in ${programTitle}.\n\nWhat happens next?\nOur admissions team will review your inquiry and contact you within 24-48 hours to discuss the program details and answer any questions you may have.\n\nBest regards,\nKSS Academy Team`
                    }),
                });

                if (!response.ok) {
                    console.error('Failed to send email:', await response.text());
                }
            } catch (emailError) {
                console.error('Email error:', emailError);
                // Don't fail the whole submission if email fails
            }

            toast({
                title: "Interest Registered!",
                description: "Thanks for reaching out. Our team will contact you shortly.",
            });
            setOpen(false);
            setFormData({ name: '', email: '', phone: '', message: '' });
        } catch (error) {
            console.error("Error submitting lead:", error);
            toast({
                variant: "destructive",
                title: "Submission Failed",
                description: "Please try again later.",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || <Button variant="outline">Show Interest</Button>}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] rounded-tl-3xl rounded-br-3xl">
                <DialogHeader>
                    <DialogTitle className="font-headline text-2xl">Express Interest</DialogTitle>
                    <DialogDescription>
                        Get more information about {programTitle} without any commitment.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <Label htmlFor="lead-name">Full Name</Label>
                        <Input
                            id="lead-name"
                            required
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="lead-email">Email Address</Label>
                        <Input
                            id="lead-email"
                            type="email"
                            required
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="lead-phone">Phone Number</Label>
                        <Input
                            id="lead-phone"
                            type="tel"
                            required
                            value={formData.phone}
                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="lead-message">Message (Optional)</Label>
                        <Textarea
                            id="lead-message"
                            value={formData.message}
                            onChange={e => setFormData({ ...formData, message: e.target.value })}
                            placeholder="Any specific questions?"
                        />
                    </div>
                    <Button type="submit" className="w-full bg-accent hover:bg-accent/90 font-bold" disabled={loading}>
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                        Submit Interest
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}
