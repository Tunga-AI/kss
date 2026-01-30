'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, AlertCircle } from 'lucide-react';
import { useAuth, useFirestore } from '@/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { addUser } from '@/lib/users';
import { addSaleLead } from '@/lib/sales';
import type { Program } from '@/lib/program-types';

interface AuthDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    program: Program;
    onSuccess: () => void;
}

export function AuthDialog({ open, onOpenChange, program, onSuccess }: AuthDialogProps) {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('register');
    
    const auth = useAuth();
    const firestore = useFirestore();

    const handleTabChange = (value: string) => {
        setActiveTab(value);
        setError(null);
        setLoading(false);
    }

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (!auth || !firestore) {
          setError("System not ready. Please try again later.");
          setLoading(false);
          return;
        }

        try {
            // 1. Create Firebase Auth user
            await createUserWithEmailAndPassword(auth, email, password);

            // 2. Create user profile in 'users' collection
            await addUser(firestore, { name, email, role: 'Learner', status: 'Active' });
            
            // 3. Create a lead in the 'sales' collection
            await addSaleLead(firestore, { name, email, program: program.title });

            // 4. Success, close dialog and trigger parent's success handler
            onSuccess();
            onOpenChange(false);

        } catch (authError: any) {
            if (authError.code === 'auth/email-already-in-use') {
                setError('This email is already registered. Please log in instead.');
            } else {
                setError('Registration failed. Please check your details and try again.');
                console.error(authError);
            }
        } finally {
            setLoading(false);
        }
    };
    
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        
        if (!auth) {
            setError("System not ready. Please try again later.");
            setLoading(false);
            return;
        }

        try {
            await signInWithEmailAndPassword(auth, email, password);
            // On successful login, just close the dialog and let the parent handle the rest.
             onSuccess();
             onOpenChange(false);
        } catch (authError: any) {
            setError('Invalid email or password.');
            console.error(authError);
        } finally {
            setLoading(false);
        }
    }


    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Join to Enroll in "{program.title}"</DialogTitle>
                    <DialogDescription>
                        Create an account or log in to continue.
                    </DialogDescription>
                </DialogHeader>
                <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="register">Register</TabsTrigger>
                        <TabsTrigger value="login">Login</TabsTrigger>
                    </TabsList>
                    <TabsContent value="register">
                        <form onSubmit={handleRegister} className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name-reg">Full Name</Label>
                                <Input id="name-reg" value={name} onChange={(e) => setName(e.target.value)} required disabled={loading} />
                            </div>
                             <div className="grid gap-2">
                                <Label htmlFor="email-reg">Email</Label>
                                <Input id="email-reg" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={loading} />
                            </div>
                             <div className="grid gap-2">
                                <Label htmlFor="password-reg">Password</Label>
                                <Input id="password-reg" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required disabled={loading} minLength={6} />
                            </div>
                             {error && activeTab === 'register' && (
                                <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle>Registration Failed</AlertTitle>
                                <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}
                            <Button type="submit" disabled={loading} className="w-full mt-2">
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Create Account
                            </Button>
                        </form>
                    </TabsContent>
                    <TabsContent value="login">
                         <form onSubmit={handleLogin} className="grid gap-4 py-4">
                             <div className="grid gap-2">
                                <Label htmlFor="email-login">Email</Label>
                                <Input id="email-login" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={loading} />
                            </div>
                             <div className="grid gap-2">
                                <Label htmlFor="password-login">Password</Label>
                                <Input id="password-login" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required disabled={loading} />
                            </div>
                             {error && activeTab === 'login' && (
                                <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle>Login Failed</AlertTitle>
                                <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}
                            <Button type="submit" disabled={loading} className="w-full mt-2">
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Login
                            </Button>
                        </form>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    )
}
