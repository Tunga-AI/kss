'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, AlertCircle } from 'lucide-react';
import { addBusinessLearner } from '@/app/actions/b2b-learners';
import { useToast } from '@/hooks/use-toast';

interface AddLearnerDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    organizationId?: string;
}

export function AddLearnerDialog({ open, onOpenChange, organizationId }: AddLearnerDialogProps) {
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!organizationId) {
            setError("Cannot add learner: Organization ID is missing.");
            return;
        }

        setLoading(true);
        setError(null);

        const formData = new FormData(event.currentTarget);
        formData.append('organizationId', organizationId);

        const result = await addBusinessLearner(formData);

        if (result.success) {
            toast({ title: "Learner Added", description: "The new learner has been added to your organization." });
            onOpenChange(false);
        } else {
            setError(result.error || 'An unknown error occurred.');
        }

        setLoading(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Add New Learner</DialogTitle>
                    <DialogDescription>
                        Enter the details for the new learner. They will need to have an authentication account created for them by a system administrator to log in.
                    </DialogDescription>
                </DialogHeader>
                 <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input id="name" name="name" required disabled={loading} />
                    </div>
                        <div className="grid gap-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" name="email" type="email" required disabled={loading} />
                    </div>
                        {error && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}
                    <Button type="submit" disabled={loading} className="w-full mt-2">
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Add Learner
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    )
}
